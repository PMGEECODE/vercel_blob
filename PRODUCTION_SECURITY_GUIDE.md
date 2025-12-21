# Production Security Guide

## Overview

This API has been hardened for production use with enterprise-grade security measures.

## Security Features Implemented

### 1. Authentication & Authorization
- **Dual authentication**: API Key (for mobile apps) + JWT (for web sessions)
- **Centralized auth logic**: All endpoints use the same authentication middleware
- **No client-side secrets**: All sensitive data stored in environment variables
- **Token expiration**: JWT tokens expire after 24 hours
- **Replay attack prevention**: JTI (JWT ID) prevents token reuse

### 2. Rate Limiting
- **Per-endpoint limits**: Different limits for read vs write operations
  - List: 60 requests/minute
  - Upload: 20 requests/minute
  - Delete: 30 requests/minute
- **Identifier-based**: Tracks by API key or IP address
- **Automatic cleanup**: Expired entries removed every 5 minutes

### 3. Input Validation & Sanitization
- **Filename sanitization**: Prevents path traversal attacks
- **File size limits**: Maximum 50MB per file
- **MIME type whitelist**: Only allowed file types can be uploaded
- **URL validation**: Ensures blob URLs are from trusted domains

### 4. Security Headers
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Content-Security-Policy**: Restricts resource loading
- **CORS**: Configurable allowed origins

### 5. Error Handling
- **No internal details leaked**: Generic error messages to clients
- **Detailed logging**: Full context logged server-side for debugging
- **Request IDs**: Every request tracked with unique ID

### 6. Logging & Auditing
- **Security-aware logging**: All auth failures logged
- **PII sanitization**: Sensitive data redacted from logs
- **Structured format**: JSON logs for easy parsing
- **Production-ready**: Can integrate with Sentry, DataDog, etc.

## Required Environment Variables

Add these to your Vercel project:

\`\`\`bash
# Blob Storage (auto-configured with Vercel Blob integration)
BLOB_READ_WRITE_TOKEN=your_blob_token

# API Authentication (generate with: openssl rand -hex 32)
API_KEY=your_secure_api_key_here

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_here

# CORS (optional, comma-separated list of allowed origins)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
\`\`\`

## API Usage

### Authentication Methods

#### Method 1: API Key (Recommended for mobile apps)

\`\`\`bash
curl -H "x-api-key: your_api_key" \
  https://your-api.vercel.app/api/list
\`\`\`

#### Method 2: JWT Bearer Token (For web sessions)

\`\`\`bash
curl -H "Authorization: Bearer your_jwt_token" \
  https://your-api.vercel.app/api/list
\`\`\`

### Endpoints

#### GET /api/list
List all files in blob storage.

**Rate limit**: 60 requests/minute

**Response**:
\`\`\`json
{
  "success": true,
  "data": [...],
  "count": 5
}
\`\`\`

#### POST /api/upload
Upload a file to blob storage.

**Rate limit**: 20 requests/minute  
**Max file size**: 50MB  
**Allowed types**: Images, PDFs, text, JSON, videos, audio

**Request**:
\`\`\`bash
curl -X POST \
  -H "x-api-key: your_api_key" \
  -F "file=@photo.jpg" \
  https://your-api.vercel.app/api/upload
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "id": "https://...",
    "name": "photo.jpg",
    "url": "https://...",
    "size": 12345
  }
}
\`\`\`

#### DELETE /api/delete?id=<blob_url>
Delete a file from blob storage.

**Rate limit**: 30 requests/minute

**Request**:
\`\`\`bash
curl -X DELETE \
  -H "x-api-key: your_api_key" \
  "https://your-api.vercel.app/api/delete?id=https://..."
\`\`\`

## Security Best Practices

### For Production Deployment

1. **Generate strong secrets**:
   \`\`\`bash
   openssl rand -hex 32  # For API_KEY
   openssl rand -hex 32  # For JWT_SECRET
   \`\`\`

2. **Configure CORS**: Set `ALLOWED_ORIGINS` to only your trusted domains

3. **Monitor logs**: Set up log aggregation (Vercel Logs, Sentry, DataDog)

4. **Rotate keys regularly**: Update API keys every 90 days

5. **Use HTTPS only**: Never send API keys over HTTP

### For Mobile Apps

1. **Store API keys securely**: Use encrypted storage (Keychain, Keystore)

2. **Don't hardcode keys**: Load from secure config or backend

3. **Implement retry logic**: Handle rate limits gracefully

4. **Validate responses**: Always check `success` field

### For Web Apps

1. **Use JWT tokens**: Generate tokens server-side after user login

2. **Store tokens securely**: Use httpOnly cookies or secure storage

3. **Refresh tokens**: Implement token refresh before expiration

4. **Handle 401 errors**: Redirect to login on authentication failure

## Monitoring & Alerting

Watch for these security events in your logs:

- `level: "security"` - Authentication failures
- `error: "Unauthorized"` - Invalid API keys or tokens
- `error: "Too Many Requests"` - Potential abuse
- `error: "Validation Error"` - Malformed requests

Set up alerts for:
- High rate of 401/403 responses (potential breach attempt)
- Repeated rate limit hits from same IP (potential DDoS)
- Sudden spike in 500 errors (service degradation)

## Testing

Use these test cases to verify security:

\`\`\`bash
# Test 1: No authentication (should fail with 401)
curl https://your-api.vercel.app/api/list

# Test 2: Invalid API key (should fail with 401)
curl -H "x-api-key: invalid" https://your-api.vercel.app/api/list

# Test 3: Rate limiting (should fail with 429 after limit)
for i in {1..100}; do
  curl -H "x-api-key: your_key" https://your-api.vercel.app/api/list
done

# Test 4: File validation (should fail with 400)
curl -X POST \
  -H "x-api-key: your_key" \
  -F "file=@malicious.exe" \
  https://your-api.vercel.app/api/upload
\`\`\`

## Incident Response

If you suspect a security breach:

1. **Rotate all secrets immediately** in Vercel dashboard
2. **Review logs** for suspicious activity patterns
3. **Check blob storage** for unauthorized files
4. **Update ALLOWED_ORIGINS** if needed
5. **Deploy updated configuration**
6. **Notify affected users** if data was compromised

## Compliance

This implementation follows security best practices from:
- OWASP Top 10
- NIST Cybersecurity Framework
- GDPR (data minimization, logging without PII)
