import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { applySecurityHeaders } from "@/lib/security/headers"

export function proxy(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 })
    return applySecurityHeaders(response)
  }

  // Apply security headers to all responses
  const response = NextResponse.next()
  return applySecurityHeaders(response)
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
}
