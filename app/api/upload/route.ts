import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { withApiProtection } from "@/lib/api/handler"
import { sanitizeFilename, validateFileSize, validateFileType } from "@/lib/security/validation"

export const runtime = "nodejs"

export const POST = withApiProtection(
  async (request: NextRequest) => {
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN not configured")
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      throw new Error("No file provided")
    }

    validateFileSize(file.size, 50) // 50MB max
    validateFileType(file.type)
    const sanitizedFilename = sanitizeFilename(file.name)

    // Upload with sanitized filename
    const blob = await put(sanitizedFilename, file, {
      access: "public",
      token,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: blob.url,
          name: blob.pathname,
          type: file.type || "application/octet-stream",
          size: file.size,
          url: blob.url,
          uploadedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    )
  },
  {
    rateLimit: {
      windowMs: 60 * 1000,
      maxRequests: 20,
    },
    requireAuth: true,
  },
)
