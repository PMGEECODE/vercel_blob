import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { blobs } = await list()

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
