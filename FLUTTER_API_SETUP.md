# Flutter API Setup Guide

## Quick Start

### 1. Get Your API Key

Your API administrator needs to generate a secure API key using:

```bash
openssl rand -hex 32
```

This key should be added to your Vercel project's environment variables as `API_KEY`.

### 2. Configure Your Flutter App

**Option A: Hardcoded (Development Only)**

Edit `lib/config/api_config.dart`:

```dart
static const String apiKey = 'your_actual_api_key_here';
```

⚠️ **WARNING**: Never commit hardcoded API keys to version control!

**Option B: Environment Variables (Recommended)**

1. Install `flutter_dotenv`:
```yaml
dependencies:
  flutter_dotenv: ^5.1.0
```

2. Create `.env` file in project root:
```
API_KEY=your_actual_api_key_here
API_BASE_URL=https://vercel-blob-navy.vercel.app/api
```

3. Add to `.gitignore`:
```
.env
```

4. Update `api_config.dart`:
```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? '';
  static String get apiKey => dotenv.env['API_KEY'] ?? '';
}
```

5. Load in `main.dart`:
```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  runApp(MyApp());
}
```

**Option C: Secure Storage (Production)**

1. Install `flutter_secure_storage`:
```yaml
dependencies:
  flutter_secure_storage: ^9.0.0
```

2. Store API key securely:
```dart
final storage = FlutterSecureStorage();
await storage.write(key: 'api_key', value: 'your_api_key');
```

3. Retrieve when needed:
```dart
final apiKey = await storage.read(key: 'api_key');
```

### 3. Test the Connection

Run your app and check the Gallery screen. If you see:
- "Invalid API key" error → Check your API key is correct
- "Access forbidden" error → API key might be missing from headers
- Files loading successfully → Everything is configured correctly!

## API Endpoints Used

All endpoints require the `x-api-key` header:

### List Files
```
GET /api/list
Headers: x-api-key: your_api_key
```

### Upload File
```
POST /api/upload
Headers: x-api-key: your_api_key
Body: multipart/form-data with 'file' field
```

### Delete File
```
DELETE /api/delete?url=file_url
Headers: x-api-key: your_api_key
```

## Security Best Practices

1. **Never hardcode API keys in production apps**
2. **Use environment variables or secure storage**
3. **Add .env files to .gitignore**
4. **Rotate API keys regularly**
5. **Use different keys for dev/staging/prod**
6. **Consider implementing a backend proxy for maximum security**

## Troubleshooting

### "Invalid API key" Error
- Verify the API key matches what's set in Vercel environment variables
- Check there are no extra spaces or line breaks
- Ensure the key is passed in the `x-api-key` header

### Files Not Loading
- Check your internet connection
- Verify the base URL is correct
- Look at debug console for detailed error messages
- Ensure the Vercel API is deployed and running

### Upload Failures
- Check file size limits (Vercel Blob has limits based on your plan)
- Verify the file format is supported
- Check network connectivity during upload

## Need Help?

Refer to:
- `FLUTTER_DOCUMENTATION.md` - Complete Flutter integration guide
- `API_DOCUMENTATION.md` - API reference documentation
- Vercel Blob documentation - https://vercel.com/docs/storage/vercel-blob
