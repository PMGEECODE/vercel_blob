# Flutter Integration Guide for Vercel Blob API

This guide will help you integrate the Vercel Blob API with your Flutter application.

## Prerequisites

- Flutter SDK installed
- A deployed instance of this API on Vercel
- Your API key (set as `API_KEY` environment variable in Vercel)

## Setup

### 1. Add Dependencies

Add the `http` package to your `pubspec.yaml`:

\`\`\`yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  mime: ^1.0.4
  http_parser: ^4.0.2
\`\`\`

Run:
\`\`\`bash
flutter pub get
\`\`\`

### 2. Create API Service Class

Create a new file `lib/services/blob_api_service.dart`:

\`\`\`dart
import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';

class BlobApiService {
  final String baseUrl;
  final String apiKey;

  BlobApiService({
    required this.baseUrl,
    required this.apiKey,
  });

  // Common headers for all requests
  Map<String, String> get _headers => {
        'x-api-key': apiKey,
      };

  /// List all files in the blob store
  Future<List<BlobFile>> listFiles() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/list'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> blobs = data['blobs'];
        return blobs.map((blob) => BlobFile.fromJson(blob)).toList();
      } else if (response.statusCode == 401) {
        throw Exception('Invalid API key');
      } else {
        throw Exception('Failed to list files: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error listing files: $e');
    }
  }

  /// Upload a file to the blob store
  Future<BlobFile> uploadFile({
    required File file,
    String? customFilename,
    Function(double)? onProgress,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/upload');
      final request = http.MultipartRequest('POST', uri);

      // Add headers
      request.headers.addAll(_headers);

      // Get file extension and mime type
      final filename = customFilename ?? file.path.split('/').last;
      final mimeType = lookupMimeType(filename) ?? 'application/octet-stream';
      final mimeTypeData = mimeType.split('/');

      // Add file to request
      final fileStream = http.ByteStream(file.openRead());
      final fileLength = await file.length();

      final multipartFile = http.MultipartFile(
        'file',
        fileStream,
        fileLength,
        filename: filename,
        contentType: MediaType(mimeTypeData[0], mimeTypeData[1]),
      );

      request.files.add(multipartFile);

      // Send request
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return BlobFile.fromJson(data['blob']);
      } else if (response.statusCode == 401) {
        throw Exception('Invalid API key');
      } else {
        throw Exception('Failed to upload file: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error uploading file: $e');
    }
  }

  /// Delete a file from the blob store
  Future<void> deleteFile(String url) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/delete'),
        headers: {
          ..._headers,
          'Content-Type': 'application/json',
        },
        body: json.encode({'url': url}),
      );

      if (response.statusCode == 200) {
        return;
      } else if (response.statusCode == 401) {
        throw Exception('Invalid API key');
      } else {
        throw Exception('Failed to delete file: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error deleting file: $e');
    }
  }
}

/// Model class for blob file
class BlobFile {
  final String url;
  final String pathname;
  final int size;
  final DateTime uploadedAt;
  final String? contentType;
  final String? contentDisposition;
  final int? cacheControlMaxAge;

  BlobFile({
    required this.url,
    required this.pathname,
    required this.size,
    required this.uploadedAt,
    this.contentType,
    this.contentDisposition,
    this.cacheControlMaxAge,
  });

  factory BlobFile.fromJson(Map<String, dynamic> json) {
    return BlobFile(
      url: json['url'],
      pathname: json['pathname'],
      size: json['size'],
      uploadedAt: DateTime.parse(json['uploadedAt']),
      contentType: json['contentType'],
      contentDisposition: json['contentDisposition'],
      cacheControlMaxAge: json['cacheControlMaxAge'],
    );
  }

  String get filename => pathname.split('/').last;

  String get sizeFormatted {
    if (size < 1024) return '$size B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(2)} KB';
    if (size < 1024 * 1024 * 1024) {
      return '${(size / (1024 * 1024)).toStringAsFixed(2)} MB';
    }
    return '${(size / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
}
\`\`\`

### 3. Configure API Service

Create a configuration file `lib/config/api_config.dart`:

\`\`\`dart
class ApiConfig {
  // Replace with your actual Vercel deployment URL
  static const String baseUrl = 'https://your-app.vercel.app';
  
  // Replace with your actual API key
  // IMPORTANT: In production, use flutter_dotenv or similar to manage secrets
  static const String apiKey = 'your_api_key_here';
}
\`\`\`

**IMPORTANT:** Never commit your API key to version control. Use `flutter_dotenv` package for environment variables:

\`\`\`yaml
# pubspec.yaml
dependencies:
  flutter_dotenv: ^5.1.0
\`\`\`

Create `.env` file:
\`\`\`
API_BASE_URL=https://your-app.vercel.app
API_KEY=your_api_key_here
\`\`\`

Load in `main.dart`:
\`\`\`dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  runApp(MyApp());
}
\`\`\`

## Usage Examples

### Example 1: List All Files

\`\`\`dart
import 'package:flutter/material.dart';
import 'services/blob_api_service.dart';
import 'config/api_config.dart';

class FileListScreen extends StatefulWidget {
  @override
  _FileListScreenState createState() => _FileListScreenState();
}

class _FileListScreenState extends State<FileListScreen> {
  final BlobApiService _apiService = BlobApiService(
    baseUrl: ApiConfig.baseUrl,
    apiKey: ApiConfig.apiKey,
  );

  List<BlobFile> _files = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFiles();
  }

  Future<void> _loadFiles() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final files = await _apiService.listFiles();
      setState(() {
        _files = files;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My Files'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadFiles,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red),
            SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadFiles,
              child: Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_files.isEmpty) {
      return Center(
        child: Text('No files uploaded yet'),
      );
    }

    return ListView.builder(
      itemCount: _files.length,
      itemBuilder: (context, index) {
        final file = _files[index];
        return ListTile(
          leading: Icon(_getFileIcon(file.contentType)),
          title: Text(file.filename),
          subtitle: Text('${file.sizeFormatted} • ${_formatDate(file.uploadedAt)}'),
          trailing: IconButton(
            icon: Icon(Icons.delete),
            onPressed: () => _deleteFile(file),
          ),
          onTap: () => _openFile(file),
        );
      },
    );
  }

  IconData _getFileIcon(String? contentType) {
    if (contentType == null) return Icons.insert_drive_file;
    if (contentType.startsWith('image/')) return Icons.image;
    if (contentType.startsWith('video/')) return Icons.video_file;
    if (contentType.startsWith('audio/')) return Icons.audio_file;
    if (contentType.contains('pdf')) return Icons.picture_as_pdf;
    return Icons.insert_drive_file;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 365) {
      return '${(difference.inDays / 365).floor()} years ago';
    } else if (difference.inDays > 30) {
      return '${(difference.inDays / 30).floor()} months ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes ago';
    } else {
      return 'Just now';
    }
  }

  Future<void> _deleteFile(BlobFile file) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete File?'),
        content: Text('Are you sure you want to delete ${file.filename}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _apiService.deleteFile(file.url);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('File deleted successfully')),
        );
        _loadFiles();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete file: $e')),
        );
      }
    }
  }

  void _openFile(BlobFile file) {
    // Implement file opening logic (e.g., launch URL)
    // You can use url_launcher package
  }
}
\`\`\`

### Example 2: Upload File

\`\`\`dart
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'services/blob_api_service.dart';
import 'config/api_config.dart';

class FileUploadScreen extends StatefulWidget {
  @override
  _FileUploadScreenState createState() => _FileUploadScreenState();
}

class _FileUploadScreenState extends State<FileUploadScreen> {
  final BlobApiService _apiService = BlobApiService(
    baseUrl: ApiConfig.baseUrl,
    apiKey: ApiConfig.apiKey,
  );

  bool _isUploading = false;
  double _uploadProgress = 0.0;

  Future<void> _pickAndUploadImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);

    if (image != null) {
      await _uploadFile(File(image.path));
    }
  }

  Future<void> _pickAndUploadFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles();

    if (result != null && result.files.single.path != null) {
      File file = File(result.files.single.path!);
      await _uploadFile(file);
    }
  }

  Future<void> _uploadFile(File file) async {
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });

    try {
      final uploadedFile = await _apiService.uploadFile(
        file: file,
        onProgress: (progress) {
          setState(() {
            _uploadProgress = progress;
          });
        },
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('File uploaded successfully!')),
      );

      // Navigate back or refresh list
      Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload failed: $e')),
      );
    } finally {
      setState(() {
        _isUploading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Upload File'),
      ),
      body: Center(
        child: _isUploading
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Uploading... ${(_uploadProgress * 100).toStringAsFixed(0)}%'),
                ],
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton.icon(
                    onPressed: _pickAndUploadImage,
                    icon: Icon(Icons.image),
                    label: Text('Upload Image'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: Size(200, 50),
                    ),
                  ),
                  SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _pickAndUploadFile,
                    icon: Icon(Icons.file_upload),
                    label: Text('Upload File'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: Size(200, 50),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
\`\`\`

### Example 3: Complete App with State Management

For a production app, consider using state management. Here's an example with Provider:

\`\`\`dart
// lib/providers/file_provider.dart
import 'package:flutter/foundation.dart';
import '../services/blob_api_service.dart';

class FileProvider with ChangeNotifier {
  final BlobApiService _apiService;

  FileProvider(this._apiService);

  List<BlobFile> _files = [];
  bool _isLoading = false;
  String? _error;

  List<BlobFile> get files => _files;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadFiles() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _files = await _apiService.listFiles();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> uploadFile(File file, {String? customFilename}) async {
    try {
      await _apiService.uploadFile(file: file, customFilename: customFilename);
      await loadFiles(); // Refresh list
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deleteFile(String url) async {
    try {
      await _apiService.deleteFile(url);
      await loadFiles(); // Refresh list
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }
}
\`\`\`

## Required Packages

Add these to your `pubspec.yaml`:

\`\`\`yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  mime: ^1.0.4
  http_parser: ^4.0.2
  file_picker: ^6.1.1
  image_picker: ^1.0.7
  flutter_dotenv: ^5.1.0
  provider: ^6.1.1  # Optional, for state management
  url_launcher: ^6.2.4  # Optional, for opening files
\`\`\`

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing file, invalid URL)
- `401` - Unauthorized (invalid API key)
- `500` - Internal Server Error

Always wrap API calls in try-catch blocks and handle errors appropriately:

\`\`\`dart
try {
  final files = await _apiService.listFiles();
  // Handle success
} on SocketException {
  // No internet connection
  print('No internet connection');
} on HttpException {
  // HTTP error
  print('HTTP error occurred');
} catch (e) {
  // Other errors
  print('Error: $e');
}
\`\`\`

## Security Best Practices

1. **Never hardcode API keys** - Use environment variables with `flutter_dotenv`
2. **Add `.env` to `.gitignore`** - Prevent committing secrets
3. **Use HTTPS only** - Ensure your API base URL uses HTTPS
4. **Validate file types** - Check file types before uploading
5. **Handle sensitive data** - Use `flutter_secure_storage` for API keys
6. **Implement retry logic** - Handle network failures gracefully
7. **Set timeouts** - Add timeouts to prevent hanging requests

## Testing

Example test file `test/blob_api_service_test.dart`:

\`\`\`dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;

void main() {
  group('BlobApiService', () {
    test('listFiles returns list of files on success', () async {
      // Add your tests here
    });

    test('uploadFile throws exception on failure', () async {
      // Add your tests here
    });
  });
}
\`\`\`

## Troubleshooting

### Common Issues

1. **401 Unauthorized Error**
   - Verify your API key is correct
   - Check that `x-api-key` header is being sent
   - Ensure API key is set in Vercel environment variables

2. **Network Error**
   - Check internet connection
   - Verify base URL is correct
   - Ensure API is deployed and running

3. **File Upload Fails**
   - Check file size limits
   - Verify file permissions on device
   - Ensure content type is supported

4. **CORS Error** (if testing on web)
   - Configure CORS headers in API routes
   - Use actual device for testing mobile features

## Support

For issues with the API itself, check the API logs in your Vercel dashboard.

For Flutter-specific issues, refer to:
- [Flutter Documentation](https://flutter.dev/docs)
- [HTTP Package Documentation](https://pub.dev/packages/http)
- [File Picker Documentation](https://pub.dev/packages/file_picker)
