import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", message: "Please provide a file to upload" },
        { status: 400 },
      )
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file", message: "The uploaded file is empty" }, { status: 400 })
    }

    const blob = await put(file.name, file, {
      access: "public",
    })

    return NextResponse.json(
      {
        id: blob.url,
        name: blob.pathname,
        type: file.type || "application/octet-stream",
        size: file.size,
        url: blob.url,
        uploadedAt: new Date().toISOString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
