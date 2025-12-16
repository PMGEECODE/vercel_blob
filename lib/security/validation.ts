export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

// Sanitize filename to prevent path traversal attacks
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    throw new ValidationError("Invalid filename")
  }

  // Remove path separators and null bytes
  const sanitized = filename.replace(/[/\\]/g, "_").replace(/\0/g, "").trim()

  if (sanitized.length === 0) {
    throw new ValidationError("Filename cannot be empty")
  }

  if (sanitized.length > 255) {
    throw new ValidationError("Filename too long (max 255 characters)")
  }

  // Prevent hidden files and parent directory references
  if (sanitized.startsWith(".") || sanitized.includes("..")) {
    throw new ValidationError("Invalid filename pattern")
  }

  return sanitized
}

// Validate file size
export function validateFileSize(size: number, maxSizeMB = 50): void {
  if (!size || size <= 0) {
    throw new ValidationError("File is empty", "file")
  }

  const maxBytes = maxSizeMB * 1024 * 1024
  if (size > maxBytes) {
    throw new ValidationError(`File too large (max ${maxSizeMB}MB)`, "file")
  }
}

// Validate file type (MIME type whitelist)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "application/json",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
]

export function validateFileType(mimeType: string): void {
  if (!mimeType || typeof mimeType !== "string") {
    throw new ValidationError("Invalid file type", "file")
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new ValidationError(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`, "file")
  }
}

// Validate URL format for blob IDs
export function validateBlobUrl(url: string): void {
  if (!url || typeof url !== "string") {
    throw new ValidationError("Invalid blob URL", "id")
  }

  try {
    const parsed = new URL(url)

    // Ensure it's HTTPS
    if (parsed.protocol !== "https:") {
      throw new ValidationError("Blob URL must use HTTPS", "id")
    }

    // Ensure it's from Vercel Blob domain
    if (
      !parsed.hostname.includes("vercel-storage.com") &&
      !parsed.hostname.includes("public.blob.vercel-storage.com")
    ) {
      throw new ValidationError("Invalid blob storage domain", "id")
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new ValidationError("Malformed blob URL", "id")
  }
}
