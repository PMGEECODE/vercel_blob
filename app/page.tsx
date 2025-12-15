"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, RefreshCw } from "lucide-react"

interface BlobFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: string
}

export default function Home() {
  const [files, setFiles] = useState<BlobFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/list")
      const data = await response.json()
      if (response.ok) {
        setFiles(data.blobs)
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert("Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        setFiles([data, ...files])
        alert("File uploaded successfully!")
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert("Failed to upload file")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      const response = await fetch(`/api/delete?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (response.ok) {
        setFiles(files.filter((f) => f.id !== id))
        alert("File deleted successfully!")
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert("Failed to delete file")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold">Vercel Blob Store</h1>
          <p className="text-muted-foreground">Manage your files with ease</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>Select a file to upload to Vercel Blob Storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Input type="file" onChange={handleUpload} disabled={uploading} className="cursor-pointer" />
              </div>
              <Button onClick={fetchFiles} disabled={loading} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Files ({files.length})</CardTitle>
            <CardDescription>All files stored in Vercel Blob</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading files...</div>
            ) : files.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No files yet. Upload your first file above.</div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.type}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
