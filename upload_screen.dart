import 'dart:typed_data';
import 'dart:io' if (dart.library.io) 'dart:io';
import 'dart:convert';

import 'package:camera/camera.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:permission_handler/permission_handler.dart';
import 'package:sizer/sizer.dart';

import '../../core/app_export.dart';
import '../../widgets/custom_app_bar.dart';
import './widgets/file_selection_card_widget.dart';
import './widgets/selected_file_item_widget.dart';
import './widgets/upload_progress_widget.dart';
import '../../config/api_config.dart';

/// Upload Screen for BlobVault
/// Fully mobile-optimized, secure API uploads
class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  final List<SelectedFileData> _selectedFiles = [];

  bool _isUploading = false;
  bool _uploadComplete = false;
  double _overallProgress = 0.0;
  final Map<String, double> _fileProgress = {};

  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        final camera = kIsWeb
            ? _cameras!.firstWhere(
                (c) => c.lensDirection == CameraLensDirection.front,
                orElse: () => _cameras!.first,
              )
            : _cameras!.firstWhere(
                (c) => c.lensDirection == CameraLensDirection.back,
                orElse: () => _cameras!.first,
              );

        _cameraController = CameraController(
          camera,
          kIsWeb ? ResolutionPreset.medium : ResolutionPreset.high,
        );

        await _cameraController!.initialize();

        try {
          await _cameraController!.setFocusMode(FocusMode.auto);
        } catch (_) {}

        if (!kIsWeb) {
          try {
            await _cameraController!.setFlashMode(FlashMode.auto);
          } catch (_) {}
        }
      }
    } catch (e) {
      debugPrint('Camera initialization error: $e');
    }
  }

  Future<bool> _requestCameraPermission() async {
    if (kIsWeb) return true;
    final status = await Permission.camera.request();
    return status.isGranted;
  }

  Future<void> _selectPhotosAndVideos() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.media,
        allowMultiple: true,
        withData: kIsWeb,
      );

      if (result != null) {
        for (var file in result.files) {
          _addSelectedFile(file.name, file.size, file.path, file.bytes,
              _getFileType(file.extension ?? ''));
        }
      }
    } catch (e) {
      _showErrorSnackBar('Failed to select files. Please try again.');
    }
  }

  Future<void> _selectDocuments() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: [
          'pdf',
          'doc',
          'docx',
          'txt',
          'xls',
          'xlsx',
          'ppt',
          'pptx'
        ],
        allowMultiple: true,
        withData: kIsWeb,
      );

      if (result != null) {
        for (var file in result.files) {
          _addSelectedFile(
              file.name, file.size, file.path, file.bytes, FileType.custom);
        }
      }
    } catch (e) {
      _showErrorSnackBar('Failed to select documents. Please try again.');
    }
  }

  void _addSelectedFile(String name, int size, String? path,
      Uint8List? bytes, FileType type) {
    setState(() {
      _selectedFiles.add(SelectedFileData(
        name: name,
        size: size,
        path: path,
        bytes: bytes,
        type: type,
      ));
      _fileProgress[name] = 0.0;
    });
  }

  Future<void> _capturePhoto() async {
    try {
      final hasPermission = await _requestCameraPermission();
      if (!hasPermission) {
        _showErrorSnackBar('Camera permission is required to take photos.');
        return;
      }

      if (_cameraController != null && _cameraController!.value.isInitialized) {
        final XFile photo = await _cameraController!.takePicture();
        await _addPhotoToSelected(photo);
      } else {
        final XFile? photo = await _imagePicker.pickImage(
          source: ImageSource.camera,
          maxWidth: 1920,
          maxHeight: 1080,
          imageQuality: 85,
        );
        if (photo != null) await _addPhotoToSelected(photo);
      }
    } catch (e) {
      _showErrorSnackBar('Failed to capture photo. Please try again.');
    }
  }

  Future<void> _addPhotoToSelected(XFile photo) async {
    final bytes = kIsWeb ? await photo.readAsBytes() : null;
    final size = kIsWeb ? bytes!.length : await File(photo.path).length();

    _addSelectedFile(
      'camera_${DateTime.now().millisecondsSinceEpoch}.jpg',
      size,
      photo.path,
      bytes,
      FileType.image,
    );
  }

  void _removeFile(int index) {
    setState(() {
      final fileName = _selectedFiles[index].name;
      _selectedFiles.removeAt(index);
      _fileProgress.remove(fileName);
    });
  }

  Future<void> _startUpload() async {
    if (_selectedFiles.isEmpty) {
      _showErrorSnackBar('Please select at least one file to upload.');
      return;
    }

    setState(() {
      _isUploading = true;
      _uploadComplete = false;
      _overallProgress = 0.0;
    });

    try {
      for (int i = 0; i < _selectedFiles.length; i++) {
        final file = _selectedFiles[i];
        await _uploadFile(file, i);
      }

      setState(() {
        _isUploading = false;
        _uploadComplete = true;
        _overallProgress = 1.0;
      });

      _showSuccessSnackBar('All files uploaded successfully!');
    } catch (e) {
      setState(() {
        _isUploading = false;
      });
      _showErrorSnackBar(
          'Upload failed: ${e.toString()}');
    }
  }

  Future<void> _uploadFile(SelectedFileData file, int index) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/upload');
    
    // Prepare file data
    Uint8List? data;
    if (kIsWeb) {
      data = file.bytes;
    } else {
      data = await File(file.path!).readAsBytes();
    }

    if (data == null) throw Exception('File data is null');

    // Create multipart request
    final request = http.MultipartRequest('POST', uri);
    
    request.headers['x-api-key'] = ApiConfig.apiKey;

    // Add file to request
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      data,
      filename: file.name,
    ));

    // Send request and track progress
    setState(() {
      _fileProgress[file.name] = 0.3; // Initial progress
    });

    try {
      final streamedResponse = await request.send();
      
      setState(() {
        _fileProgress[file.name] = 0.7; // Mid progress
      });

      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        
        if (jsonResponse['success'] == true) {
          setState(() {
            _fileProgress[file.name] = 1.0;
            _overallProgress = (index + 1) / _selectedFiles.length;
          });
        } else {
          throw Exception(jsonResponse['error'] ?? 'Upload failed');
        }
      } else if (response.statusCode == 401) {
        throw Exception('Authentication failed. Please check your API key.');
      } else {
        final jsonResponse = json.decode(response.body);
        throw Exception(jsonResponse['error'] ?? 'Upload failed');
      }
    } catch (e) {
      setState(() {
        _fileProgress[file.name] = 0.0;
      });
      rethrow;
    }
  }

  FileType _getFileType(String extension) {
    final imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    final videoExts = ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv'];

    if (imageExts.contains(extension.toLowerCase())) return FileType.image;
    if (videoExts.contains(extension.toLowerCase())) return FileType.video;
    return FileType.custom;
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: Theme.of(context).colorScheme.error,
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 3),
    ));
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: AppTheme.successLight,
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 3),
    ));
  }

  Future<bool> _onWillPop() async {
    if (_isUploading) {
      final shouldPop = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Upload in Progress'),
          content:
              const Text('Are you sure you want to cancel the upload and go back?'),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Continue Upload')),
            TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: Text('Cancel Upload',
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error))),
          ],
        ),
      );
      return shouldPop ?? false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        appBar: CustomAppBar(
          title: 'Upload',
          variant: CustomAppBarVariant.detail,
          automaticallyImplyLeading: true,
        ),
        body: SafeArea(
            child: _uploadComplete
                ? _buildSuccessView(theme)
                : _buildUploadView(theme)),
      ),
    );
  }

  Widget _buildUploadView(ThemeData theme) {
    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Select Files',
              style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface)),
          SizedBox(height: 2.h),
          FileSelectionCardWidget(
              title: 'Photos & Videos',
              subtitle: 'JPG, PNG, MP4, MOV (Max 100MB)',
              iconName: 'photo_library',
              onTap: _selectPhotosAndVideos),
          SizedBox(height: 2.h),
          FileSelectionCardWidget(
              title: 'Documents',
              subtitle: 'PDF, DOC, XLS, PPT (Max 50MB)',
              iconName: 'description',
              onTap: _selectDocuments),
          SizedBox(height: 2.h),
          FileSelectionCardWidget(
              title: 'Camera',
              subtitle: 'Take a photo instantly',
              iconName: 'camera_alt',
              onTap: _capturePhoto),
          if (_selectedFiles.isNotEmpty) ...[
            SizedBox(height: 3.h),
            Text(
                'Selected Files (${_selectedFiles.length})',
                style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface)),
            SizedBox(height: 1.h),
            SizedBox(
              height: 15.h,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _selectedFiles.length,
                separatorBuilder: (context, index) => SizedBox(width: 2.w),
                itemBuilder: (context, index) {
                  return SelectedFileItemWidget(
                      fileData: _selectedFiles[index],
                      onRemove: () => _removeFile(index));
                },
              ),
            ),
          ],
          if (_isUploading || _fileProgress.isNotEmpty) ...[
            SizedBox(height: 3.h),
            UploadProgressWidget(
              isUploading: _isUploading,
              overallProgress: _overallProgress,
              fileProgress: _fileProgress,
            ),
          ],
          SizedBox(height: 3.h),
          if (_selectedFiles.isNotEmpty && !_isUploading)
            SizedBox(
              width: double.infinity,
              height: 6.h,
              child: ElevatedButton(
                  onPressed: _startUpload,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: theme.colorScheme.onPrimary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Start Upload',
                      style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onPrimary))),
            ),
        ],
      ),
    );
  }

  Widget _buildSuccessView(ThemeData theme) {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 8.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 20.w,
              height: 20.w,
              decoration: BoxDecoration(
                  color: AppTheme.successLight.withValues(alpha: 0.1),
                  shape: BoxShape.circle),
              child: CustomIconWidget(
                  iconName: 'check_circle',
                  color: AppTheme.successLight,
                  size: 12.w),
            ),
            SizedBox(height: 3.h),
            Text('Upload Complete!',
                style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface),
                textAlign: TextAlign.center),
            SizedBox(height: 1.h),
            Text(
                '${_selectedFiles.length} ${_selectedFiles.length == 1 ? 'file' : 'files'} uploaded successfully',
                style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                textAlign: TextAlign.center),
            SizedBox(height: 4.h),
            SizedBox(
              width: double.infinity,
              height: 6.h,
              child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushReplacementNamed(context, '/gallery-screen');
                  },
                  style: ElevatedButton.styleFrom(
                      backgroundColor: theme.colorScheme.primary,
                      foregroundColor: theme.colorScheme.onPrimary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12))),
                  child: Text('View in Gallery',
                      style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onPrimary))),
            ),
            SizedBox(height: 2.h),
            SizedBox(
              width: double.infinity,
              height: 6.h,
              child: OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _selectedFiles.clear();
                      _fileProgress.clear();
                      _uploadComplete = false;
                      _overallProgress = 0.0;
                    });
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: theme.colorScheme.primary,
                    side: BorderSide(color: theme.colorScheme.primary),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Upload More Files',
                      style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.primary))),
            ),
          ],
        ),
      ),
    );
  }
}

class SelectedFileData {
  final String name;
  final int size;
  final String? path;
  final Uint8List? bytes;
  final FileType type;

  SelectedFileData(
      {required this.name,
      required this.size,
      this.path,
      this.bytes,
      required this.type});

  String get formattedSize {
    if (size < 1024) return '$size B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)} KB';
    return '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
