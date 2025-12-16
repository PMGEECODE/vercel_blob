import type { NextResponse } from "next/server"

// Apply security headers to all responses
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY")

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")

  // XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block")

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https://*.vercel-storage.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'",
  )

  // Permissions policy
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  return response
}

// CORS configuration for API routes
export function applyCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || []

  // If no origins configured, allow none (most secure)
  if (allowedOrigins.length === 0 || !origin) {
    return response
  }

  // Check if origin is allowed
  if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key")
    response.headers.set("Access-Control-Max-Age", "86400")
  }

  return response
}
