import { list } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { withApiProtection } from "@/lib/api/handler"

export const runtime = "nodejs"

export const GET = withApiProtection(
  async (request: NextRequest) => {
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN not configured")
    }

    const { blobs } = await list({ token })

    const formattedBlobs = blobs.map((blob) => ({
      id: blob.url,
      name: blob.pathname,
      type: blob.contentType || "application/octet-stream",
      size: blob.size,
      url: blob.url,
      uploadedAt: blob.uploadedAt,
    }))

    return NextResponse.json(
      {
        success: true,
        data: formattedBlobs,
        count: formattedBlobs.length,
      },
      { status: 200 },
    )
  },
  {
    rateLimit: {
      windowMs: 60 * 1000,
      maxRequests: 60,
    },
    requireAuth: true,
  },
)
