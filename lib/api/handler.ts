import { type NextRequest, NextResponse } from "next/server"
import { authenticate, AuthError, type AuthContext } from "@/lib/security/auth"
import { rateLimit, RateLimitError, type RateLimitConfig } from "@/lib/security/rate-limit"
import { ValidationError } from "@/lib/security/validation"
import { applySecurityHeaders, applyCorsHeaders } from "@/lib/security/headers"
import { SecurityLogger } from "@/lib/security/logger"

export interface ApiHandlerConfig {
  rateLimit?: RateLimitConfig
  requireAuth?: boolean
}

type ApiHandler = (request: NextRequest, context: AuthContext) => Promise<NextResponse>

// Centralized API handler wrapper with all security measures
export function withApiProtection(
  handler: ApiHandler,
  config: ApiHandlerConfig = {},
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const requestId = crypto.randomUUID()
    const startTime = Date.now()

    try {
      // Log incoming request
      SecurityLogger.info("API Request", {
        requestId,
        method: request.method,
        url: request.url,
        origin: request.headers.get("origin"),
      })

      // Apply rate limiting
      if (config.rateLimit) {
        rateLimit(request, config.rateLimit)
      }

      // Authenticate request
      let authContext: AuthContext = { authenticated: false }

      if (config.requireAuth !== false) {
        authContext = await authenticate(request)
      }

      // Execute handler
      const response = await handler(request, authContext)

      // Apply security headers
      let securedResponse = applySecurityHeaders(response)

      // Apply CORS if needed
      const origin = request.headers.get("origin")
      if (origin) {
        securedResponse = applyCorsHeaders(securedResponse, origin)
      }

      // Log successful response
      const duration = Date.now() - startTime
      SecurityLogger.info("API Response", {
        requestId,
        status: response.status,
        duration: `${duration}ms`,
      })

      return securedResponse
    } catch (error) {
      const duration = Date.now() - startTime

      // Handle authentication errors
      if (error instanceof AuthError) {
        SecurityLogger.security("Authentication failed", {
          requestId,
          error: error.message,
          statusCode: error.statusCode,
        })

        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: "Unauthorized",
              message: error.message,
            },
            { status: error.statusCode },
          ),
        )
      }

      // Handle rate limit errors
      if (error instanceof RateLimitError) {
        SecurityLogger.warn("Rate limit exceeded", {
          requestId,
          retryAfter: error.retryAfter,
        })

        const response = NextResponse.json(
          {
            success: false,
            error: "Too Many Requests",
            message: error.message,
          },
          { status: 429 },
        )
        response.headers.set("Retry-After", error.retryAfter.toString())

        return applySecurityHeaders(response)
      }

      // Handle validation errors
      if (error instanceof ValidationError) {
        SecurityLogger.warn("Validation failed", {
          requestId,
          field: error.field,
          message: error.message,
        })

        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: "Validation Error",
              message: error.message,
              field: error.field,
            },
            { status: 400 },
          ),
        )
      }

      // Handle unexpected errors (don't leak internal details)
      SecurityLogger.error("Unexpected error", {
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration}ms`,
      })

      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Internal Server Error",
            message: "An unexpected error occurred",
            requestId, // Include for debugging
          },
          { status: 500 },
        ),
      )
    }
  }
}
