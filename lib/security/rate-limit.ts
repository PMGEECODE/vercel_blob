import type { NextRequest } from "next/server"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
  ) {
    super(message)
    this.name = "RateLimitError"
  }
}

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
      if (store[key].resetAt < now) {
        delete store[key]
      }
    })
  },
  5 * 60 * 1000,
)

export function rateLimit(request: NextRequest, config: RateLimitConfig): void {
  // Get identifier (IP address or API key)
  const identifier =
    request.headers.get("x-api-key") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"

  const now = Date.now()
  const key = `rate_limit:${identifier}`

  if (!store[key] || store[key].resetAt < now) {
    // Initialize or reset the rate limit window
    store[key] = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    return
  }

  store[key].count++

  if (store[key].count > config.maxRequests) {
    const retryAfter = Math.ceil((store[key].resetAt - now) / 1000)
    throw new RateLimitError(`Rate limit exceeded. Try again in ${retryAfter} seconds`, retryAfter)
  }
}
