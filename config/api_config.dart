/// API Configuration for Vercel Blob Store
/// 
/// IMPORTANT: Never commit API keys to version control!
/// In production, use one of these secure approaches:
/// 
/// 1. Environment Variables (recommended):
///    - Use flutter_dotenv package
///    - Store keys in .env file (add to .gitignore)
///    - Load with: dotenv.env['API_KEY']
/// 
/// 2. Secure Storage (for sensitive data):
///    - Use flutter_secure_storage package
///    - Store keys encrypted on device
/// 
/// 3. Backend Proxy (most secure):
///    - Create your own backend that holds the API key
///    - Flutter app calls your backend, not Vercel directly

class ApiConfig {
  // Base URL for your Vercel Blob API
  static const String baseUrl = 'https://vercel-blob-navy.vercel.app/api';
  
  // TODO: Replace with your actual API key
  // For production, load from secure storage or environment variables
  static const String apiKey = 'YOUR_API_KEY_HERE';
  
  // Request timeout duration
  static const Duration timeout = Duration(seconds: 30);
  
  // Get authenticated headers for API requests
  static Map<String, String> getHeaders() {
    return {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };
  }
  
  // Validate API configuration
  static bool isConfigured() {
    return apiKey.isNotEmpty && apiKey != 'YOUR_API_KEY_HERE';
  }
}
