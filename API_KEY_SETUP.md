# 🔐 Your Secure API Key

## Generated API Key

Copy and save this API key securely - you'll need it for your Flutter app:

\`\`\`
7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a
\`\`\`

**⚠️ IMPORTANT SECURITY NOTES:**

1. **Never commit this key to Git or any version control**
2. **Store it securely in your Flutter app** (see instructions below)
3. **This key provides full access to your Blob storage API**
4. **Rotate this key regularly for maximum security**

---

## 📱 How to Use This API Key in Flutter

### Step 1: Update Your Configuration File

Open your `config/api_config.dart` file and replace the placeholder with your actual API key:

\`\`\`dart
class ApiConfig {
  // Your deployed Vercel API URL
  static const String baseUrl = 'https://your-domain.vercel.app';
  
  // 🔐 Your secure API key - NEVER commit this to Git!
  static const String apiKey = '7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a';
}
\`\`\`

### Step 2: Secure the API Key (Production Best Practices)

For production apps, **DO NOT hardcode the API key**. Instead:

#### Option 1: Environment Variables (Recommended)

1. Install `flutter_dotenv` package:
\`\`\`yaml
dependencies:
  flutter_dotenv: ^5.1.0
\`\`\`

2. Create a `.env` file in your project root:
\`\`\`env
API_KEY=7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a
BASE_URL=https://your-domain.vercel.app
\`\`\`

3. Add `.env` to your `.gitignore`:
\`\`\`gitignore
.env
.env.*
\`\`\`

4. Update `api_config.dart`:
\`\`\`dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String get baseUrl => dotenv.env['BASE_URL'] ?? '';
  static String get apiKey => dotenv.env['API_KEY'] ?? '';
}
\`\`\`

5. Load in `main.dart`:
\`\`\`dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  runApp(MyApp());
}
\`\`\`

#### Option 2: Flutter Secure Storage

1. Install package:
\`\`\`yaml
dependencies:
  flutter_secure_storage: ^9.0.0
\`\`\`

2. Store the key securely on first launch:
\`\`\`dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Store once
await storage.write(key: 'api_key', value: 'your_api_key_here');

// Retrieve when needed
final apiKey = await storage.read(key: 'api_key');
\`\`\`

---

## 🚀 Adding the API Key to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name:** `API_KEY`
   - **Value:** `7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a`
   - **Environment:** Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application

---

## 🧪 Testing Your API Key

### Using cURL (Terminal):

\`\`\`bash
# Test list endpoint
curl -H "x-api-key: 7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a" \
  https://your-domain.vercel.app/api/list

# Test upload endpoint
curl -H "x-api-key: 7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a" \
  -F "file=@/path/to/your/file.jpg" \
  https://your-domain.vercel.app/api/upload
\`\`\`

### Using Postman:

1. Create a new request
2. Add header: `x-api-key: 7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a`
3. Test your endpoints

---

## 🔄 Rotating Your API Key

To generate a new API key:

\`\`\`bash
# On macOS/Linux
openssl rand -hex 32

# On Windows (PowerShell)
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[BitConverter]::ToString($bytes).Replace("-", "").ToLower()
\`\`\`

After generating a new key:
1. Update the `API_KEY` environment variable in Vercel
2. Redeploy your API
3. Update your Flutter app configuration
4. Release a new app version to users

---

## 📊 Monitoring API Usage

Monitor your API for:
- Unusual traffic patterns
- Failed authentication attempts
- Unexpected file uploads/deletions

Consider implementing rate limiting if you notice abuse.

---

## 🆘 Troubleshooting

**"Invalid API key" error:**
- Verify the key matches exactly (no extra spaces)
- Check that the `API_KEY` environment variable is set in Vercel
- Ensure you've redeployed after adding the environment variable

**"Authorization header missing" error:**
- Verify you're sending the `x-api-key` header
- Check the header name is exactly `x-api-key` (case-sensitive)

**Connection errors:**
- Verify your `baseUrl` is correct
- Check your internet connection
- Ensure the Vercel deployment is active

---

## 📚 Additional Resources

- [Flutter API Documentation](./FLUTTER_DOCUMENTATION.md)
- [API Endpoints Documentation](./API_DOCUMENTATION.md)
- [Security Best Practices](https://owasp.org/www-project-mobile-top-10/)
