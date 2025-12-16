import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { withApiProtection } from "@/lib/api/handler"
import { validateBlobUrl } from "@/lib/security/validation"

export const runtime = "nodejs"

export const DELETE = withApiProtection(
  async (request: NextRequest) => {
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN not configured")
    }

    const { searchParams } = new URL(request.url)
    const blobId = searchParams.get("id")

    if (!blobId) {
      throw new Error("Blob ID is required")
    }

    validateBlobUrl(blobId)

    await del(blobId, { token })

    return NextResponse.json(
      {
        success: true,
        message: "File deleted successfully",
      },
      { status: 200 },
    )
  },
  {
    rateLimit: {
      windowMs: 60 * 1000,
      maxRequests: 30,
    },
    requireAuth: true,
  },
)
