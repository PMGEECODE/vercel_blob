# Vercel Blob Store API

A serverless Next.js project for managing files in Vercel Blob Store with three simple API endpoints.

## Features

- **List Files** - Retrieve all files stored in Blob Store
- **Upload Files** - Upload files via multipart/form-data
- **Delete Files** - Remove files from storage

## API Endpoints

### 1. List Files
```
GET /api/list
```

Returns all blobs in JSON format with metadata (id, name, type, size, url, uploadedAt).

**Example Response:**
```json
{
  "blobs": [
    {
      "id": "https://...",
      "name": "example.png",
      "type": "image/png",
      "size": 12345,
      "url": "https://...",
      "uploadedAt": "2025-01-15T12:00:00.000Z"
    }
  ]
}
```

### 2. Upload File
```
POST /api/upload
```

Accepts a file upload via multipart/form-data. The file should be sent with the field name `file`.

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/your/file.png"
```

**Example Response:**
```json
{
  "id": "https://...",
  "name": "file.png",
  "type": "image/png",
  "size": 12345,
  "url": "https://...",
  "uploadedAt": "2025-01-15T12:00:00.000Z"
}
```

### 3. Delete File
```
DELETE /api/delete?id=<blobId>
```

Deletes a file from Blob Store using its URL as the ID.

**Example using cURL:**
```bash
curl -X DELETE "http://localhost:3000/api/delete?id=https://..."
```

**Example Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Setup

### 1. Environment Variables

You need to set up the Vercel Blob Store token. The `@vercel/blob` package automatically reads from the `BLOB_READ_WRITE_TOKEN` environment variable.

#### Local Development

Create a `.env.local` file in the root directory:

```env
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

You can get your Blob Store token from:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Create a new Blob Store or use an existing one
5. Copy the `BLOB_READ_WRITE_TOKEN` value

#### Production (Vercel)

When deploying to Vercel:
1. The Blob Store token is automatically configured if you connect a Blob Store to your project
2. Or manually add `BLOB_READ_WRITE_TOKEN` in your project settings under **Environment Variables**

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/`

## Deployment

### Deploy to Vercel

This project is ready to deploy to Vercel immediately:

1. **Using Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Using GitHub:**
   - Push your code to GitHub
   - Import the repository in [Vercel Dashboard](https://vercel.com/new)
   - Vercel will automatically detect Next.js and configure the build

3. **Configure Blob Store:**
   - In your Vercel project, go to the **Storage** tab
   - Add or connect a Blob Store
   - The environment variables will be automatically configured

## Error Handling

All endpoints return JSON responses with proper HTTP status codes:
- `200` - Success
- `201` - Created (upload)
- `400` - Bad Request (validation errors)
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Tech Stack

- **Next.js 16** - App Router with Route Handlers
- **@vercel/blob** - Vercel Blob Store SDK
- **TypeScript** - Type safety

## License

MIT
