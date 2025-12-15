import { del } from "@vercel/blob"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const blobId = searchParams.get("id")

    if (!blobId) {
      return NextResponse.json(
        { error: "Missing blob ID", message: "Please provide a blob ID to delete" },
        { status: 400 },
      )
    }

    if (!blobId.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid blob ID", message: "Blob ID must be a valid URL" }, { status: 400 })
    }

    await del(blobId)

    return NextResponse.json({ success: true, message: "File deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error deleting blob:", error)
    return NextResponse.json(
      { error: "Failed to delete file", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
