import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      return NextResponse.json(
        { error: "Configuration error", message: "BLOB_READ_WRITE_TOKEN is not configured" },
        { status: 500 },
      )
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

    return NextResponse.json({ blobs: formattedBlobs }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error listing blobs:", error)
    return NextResponse.json(
      { error: "Failed to list files", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
