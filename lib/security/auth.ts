import type { NextRequest } from "next/server"
import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-in-production")
const API_KEY = process.env.API_KEY

export interface AuthContext {
  authenticated: boolean
  userId?: string
  sessionId?: string
  apiKey?: string
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode = 401,
  ) {
    super(message)
    this.name = "AuthError"
  }
}

// Generate JWT token for authenticated sessions
export async function generateToken(payload: { userId: string; sessionId: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .setJti(crypto.randomUUID()) // Prevents replay attacks
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<{ userId: string; sessionId: string; jti: string }> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as { userId: string; sessionId: string; jti: string }
  } catch (error) {
    throw new AuthError("Invalid or expired token", 401)
  }
}

// Centralized authentication middleware
export async function authenticate(request: NextRequest): Promise<AuthContext> {
  // Check for API Key (for mobile apps and external services)
  const apiKey = request.headers.get("x-api-key")

  if (apiKey) {
    if (!API_KEY) {
      throw new AuthError("API authentication not configured", 500)
    }

    if (apiKey !== API_KEY) {
      throw new AuthError("Invalid API key", 401)
    }

    return {
      authenticated: true,
      apiKey,
    }
  }

  // Check for JWT token (for web sessions)
  const authHeader = request.headers.get("authorization")

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7)

    try {
      const payload = await verifyToken(token)
      return {
        authenticated: true,
        userId: payload.userId,
        sessionId: payload.sessionId,
      }
    } catch (error) {
      throw new AuthError("Invalid or expired session token", 401)
    }
  }

  // No valid authentication found
  throw new AuthError("Authentication required. Provide x-api-key or Bearer token", 401)
}
