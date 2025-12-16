import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sizer/sizer.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../core/app_export.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/custom_bottom_bar.dart';
import './widgets/empty_state_widget.dart';
import './widgets/file_grid_item_widget.dart';
import './widgets/file_list_item_widget.dart';
import './widgets/loading_skeleton_widget.dart';

/// Gallery Screen - Displays uploaded files from Vercel Blob Store
class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  bool _isGridView = true;
  bool _isLoading = false;
  bool _isSearching = false;
  String _searchQuery = '';
  List<Map<String, dynamic>> _files = [];
  List<Map<String, dynamic>> _filteredFiles = [];

  final String _baseUrl = 'https://vercel-blob-navy.vercel.app/api';
  
  // TODO: Move this to a secure configuration file or environment variables
  // NEVER hardcode API keys in production apps - use flutter_dotenv or secure storage
  final String _apiKey = 'YOUR_API_KEY_HERE'; // Replace with your actual API key

  @override
  void initState() {
    super.initState();
    _loadFiles();
  }

  Map<String, String> _getAuthHeaders() {
    return {
      'x-api-key': _apiKey,
      'Content-Type': 'application/json',
    };
  }

  Future<void> _loadFiles() async {
    setState(() => _isLoading = true);
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/list'),
        headers: _getAuthHeaders(),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data['success'] == true && data['blobs'] != null) {
          final List<dynamic> blobs = data['blobs'];
          final files = blobs.map<Map<String, dynamic>>((blob) {
            return {
              'id': blob['pathname'] ?? blob['url'], // Use pathname as unique identifier
              'name': _extractFileName(blob['pathname'] ?? ''),
              'url': blob['url'],
              'type': _getFileType(blob['pathname'] ?? ''),
              'size': blob['size'] ?? 0,
              'uploadedAt': DateTime.tryParse(blob['uploadedAt'] ?? '') ?? DateTime.now(),
            };
          }).toList();

          setState(() {
            _files = files;
            _filteredFiles = files;
          });
        } else {
          throw Exception(data['error'] ?? 'Failed to load files');
        }
      } else if (response.statusCode == 401) {
        throw Exception('Invalid API key. Please check your authentication credentials.');
      } else if (response.statusCode == 403) {
        throw Exception('Access forbidden. API key may be missing or invalid.');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to load files');
      }
    } catch (e) {
      debugPrint('Error fetching files: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to fetch files: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String _extractFileName(String pathname) {
    if (pathname.isEmpty) return 'Unknown';
    final parts = pathname.split('/');
    return parts.last;
  }

  String _getFileType(String pathname) {
    final extension = pathname.split('.').last.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].contains(extension)) {
      return 'image/$extension';
    } else if (['mp4', 'mov', 'avi', 'webm'].contains(extension)) {
      return 'video/$extension';
    } else if (['pdf'].contains(extension)) {
      return 'application/pdf';
    }
    return 'application/octet-stream';
  }

  Future<void> _refreshFiles() async {
    HapticFeedback.mediumImpact();
    await _loadFiles();
  }

  void _toggleView() => setState(() => _isGridView = !_isGridView);

  void _toggleSearch() {
    setState(() {
      _isSearching = !_isSearching;
      if (!_isSearching) {
        _searchQuery = '';
        _filteredFiles = _files;
      }
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
      _filteredFiles = query.isEmpty
          ? _files
          : _files.where((file) {
              final fileName = (file['name'] as String).toLowerCase();
              return fileName.contains(query.toLowerCase());
            }).toList();
    });
  }

  Future<void> _deleteFile(Map<String, dynamic> file) async {
    try {
      final url = Uri.parse('$_baseUrl/delete').replace(
        queryParameters: {'url': file['url']},
      );
      
      final response = await http.delete(
        url,
        headers: _getAuthHeaders(),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data['success'] == true) {
          setState(() {
            _files.removeWhere((f) => f['id'] == file['id']);
            _filteredFiles.removeWhere((f) => f['id'] == file['id']);
          });

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('${file['name']} deleted'),
                action: SnackBarAction(
                  label: 'Undo',
                  onPressed: _refreshFiles,
                ),
              ),
            );
          }
        } else {
          throw Exception(data['error'] ?? 'Failed to delete file');
        }
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        throw Exception('Authentication failed. Please check your API key.');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to delete file');
      }
    } catch (e) {
      debugPrint('Error deleting file: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to delete file: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }


  void _onFileLongPressed(Map<String, dynamic> file) {
    HapticFeedback.mediumImpact();
    _showFileOptionsBottomSheet(file);
  }

  void _showFileOptionsBottomSheet(Map<String, dynamic> file) {
    final theme = Theme.of(context);

    showModalBottomSheet(
      context: context,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: CustomIconWidget(iconName: 'share', size: 24, color: theme.colorScheme.onSurface),
              title: const Text('Share'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: CustomIconWidget(iconName: 'download', size: 24, color: theme.colorScheme.onSurface),
              title: const Text('Download'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: CustomIconWidget(iconName: 'info', size: 24, color: theme.colorScheme.onSurface),
              title: const Text('View Details'),
              onTap: () {
                Navigator.pop(context);
                _onFilePressed(file);
              },
            ),
            ListTile(
              leading: CustomIconWidget(iconName: 'delete', size: 24, color: theme.colorScheme.error),
              title: Text('Delete', style: TextStyle(color: theme.colorScheme.error)),
              onTap: () {
                Navigator.pop(context);
                _showDeleteConfirmation(file);
              },
            ),
            SizedBox(height: 2.h),
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirmation(Map<String, dynamic> file) {
    final theme = Theme.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete File'),
        content: Text('Are you sure you want to delete "${file['name']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteFile(file);
            },
            style: TextButton.styleFrom(foregroundColor: theme.colorScheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Widget _buildFilePreviewDialog(Map<String, dynamic> file) {
    final theme = Theme.of(context);
    final fileType = file['type'] as String;

    return Dialog(
      backgroundColor: theme.colorScheme.surface,
      child: Container(
        constraints: BoxConstraints(maxHeight: 70.h),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: EdgeInsets.all(4.w),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: theme.colorScheme.outline.withAlpha(50))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(file['name'] as String,
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: CustomIconWidget(iconName: 'close', size: 24, color: theme.colorScheme.onSurface),
                  ),
                ],
              ),
            ),
            Expanded(
              child: fileType.startsWith('image/')
                  ? InteractiveViewer(
                      child: CustomImageWidget(
                        imageUrl: file['url'] as String,
                        width: double.infinity,
                        height: double.infinity,
                        fit: BoxFit.contain,
                        semanticLabel: "Full-size preview of ${file['name']}",
                      ),
                    )
                  : Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CustomIconWidget(
                            iconName: fileType.startsWith('video/') ? 'play_circle_outline' : 'insert_drive_file',
                            size: 64,
                            color: theme.colorScheme.primary,
                          ),
                          SizedBox(height: 2.h),
                          Text(
                            fileType.startsWith('video/') ? 'Video Preview' : 'Document Preview',
                            style: theme.textTheme.titleMedium,
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: _isSearching
          ? CustomAppBar(
              variant: CustomAppBarVariant.search,
              onSearchChanged: _onSearchChanged,
              searchHint: 'Search files...',
              actions: [
                IconButton(
                  onPressed: _toggleSearch,
                  icon: CustomIconWidget(iconName: 'close', size: 24, color: theme.colorScheme.onSurface),
                ),
              ],
            )
          : CustomAppBar(
              title: 'Gallery',
              variant: CustomAppBarVariant.standard,
              actions: [
                IconButton(
                  onPressed: _toggleView,
                  icon: CustomIconWidget(
                    iconName: _isGridView ? 'view_list' : 'grid_view',
                    size: 24,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                IconButton(
                  onPressed: _toggleSearch,
                  icon: CustomIconWidget(iconName: 'search', size: 24, color: theme.colorScheme.onSurface),
                ),
              ],
            ),
      body: _isLoading
          ? LoadingSkeletonWidget(isGridView: _isGridView)
          : _filteredFiles.isEmpty
              ? _searchQuery.isNotEmpty
                  ? _buildNoResultsWidget()
                  : EmptyStateWidget(onUploadPressed: () => Navigator.pushNamed(context, '/upload-screen'))
              : RefreshIndicator(
                  onRefresh: _refreshFiles,
                  child: _isGridView ? _buildGridView() : _buildListView(),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/upload-screen'),
        child: CustomIconWidget(iconName: 'add', size: 28, color: theme.colorScheme.onSecondary),
      ),
      bottomNavigationBar: CustomBottomBar(
        currentItem: CustomBottomBarItem.gallery,
        onItemSelected: (item) {},
      ),
    );
  }

  Widget _buildGridView() {
    return GridView.builder(
      padding: EdgeInsets.all(4.w),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 3.w,
        mainAxisSpacing: 3.w,
        childAspectRatio: 0.85,
      ),
      itemCount: _filteredFiles.length,
      itemBuilder: (context, index) {
        final file = _filteredFiles[index];
        return FileGridItemWidget(
          fileData: file,
          onTap: () => _onFilePressed(file),
          onLongPress: () => _onFileLongPressed(file),
        );
      },
    );
  }

  Widget _buildListView() {
    return ListView.builder(
      padding: EdgeInsets.symmetric(vertical: 2.h),
      itemCount: _filteredFiles.length,
      itemBuilder: (context, index) {
        final file = _filteredFiles[index];
        return FileListItemWidget(
          fileData: file,
          onTap: () => _onFilePressed(file),
          onLongPress: () => _onFileLongPressed(file),
          onDelete: () => _deleteFile(file),
        );
      },
    );
  }

  Widget _buildNoResultsWidget() {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 8.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CustomIconWidget(iconName: 'search_off', size: 64, color: theme.colorScheme.onSurfaceVariant),
            SizedBox(height: 2.h),
            Text(
              'No Results Found',
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 1.h),
            Text(
              'Try searching with different keywords',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
