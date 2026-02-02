# Mobile App File Upload - Web Platform Fix

## Issue

**Error:** `Exception: Network error during upload: Unsupported operation: MultipartFile is only supported where dart:io is available.`

**Cause:** The mobile app was running on Chrome (web platform), but the file upload code was using `dart:io` File API and `MultipartFile.fromPath()`, which are only available on mobile platforms (Android/iOS), not on web.

---

## Root Cause

### Original Code (Mobile-Only)
```dart
import 'dart:io'; // ❌ Not available on web

Future<void> _pickAndUploadFile() async {
  FilePickerResult? result = await FilePicker.platform.pickFiles(...);
  
  if (result != null) {
    final file = File(result.files.single.path!); // ❌ dart:io File
    final res = await apiService.uploadFile(file.path, 'assignments');
  }
}

// In api_service.dart
Future<Map<String, dynamic>> uploadFile(String filePath, String folder) async {
  request.files.add(await http.MultipartFile.fromPath('file', filePath)); // ❌ fromPath not available on web
}
```

**Problem:** 
- `dart:io` is not available in web environments
- `File` class doesn't exist on web
- `MultipartFile.fromPath()` requires file system access (not available on web)
- File paths don't exist on web (files are accessed as bytes)

---

## Solution

### Updated Code (Cross-Platform)

#### 1. API Service - Support Both Path and Bytes
**File:** `mobile_app/lib/services/api_service.dart`

```dart
Future<Map<String, dynamic>> uploadFile(
  dynamic fileData,  // ⭐ Accept both String (path) and List<int> (bytes)
  String folder, 
  {String? fileName}
) async {
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('$_baseUrl/api/institution/upload'),
  );
  request.headers.addAll(_headers);
  
  // ⭐ Handle both file path (mobile) and bytes (web)
  if (fileData is String) {
    // Mobile: file path
    request.files.add(await http.MultipartFile.fromPath('file', fileData));
  } else if (fileData is List<int>) {
    // Web: bytes
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      fileData,
      filename: fileName ?? 'file',
    ));
  } else {
    throw Exception('Invalid file data type');
  }
  
  request.fields['folder'] = folder;
  
  final streamedResponse = await request.send();
  final response = await http.Response.fromStream(streamedResponse);
  
  if (response.statusCode == 200 || response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to upload file: ${response.statusCode}');
  }
}
```

#### 2. Create Assignment Screen - Use Bytes on Web
**File:** `mobile_app/lib/screens/teacher/create_assignment_screen.dart`

```dart
// ❌ Removed: import 'dart:io';

Future<void> _pickAndUploadFile() async {
  try {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'png', 'zip'],
      withData: true, // ⭐ Get bytes for web compatibility
    );

    if (result != null) {
      setState(() => _isUploading = true);
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      // ⭐ Use bytes if available (web), otherwise use path (mobile)
      final fileData = result.files.single.bytes ?? result.files.single.path;
      
      if (fileData == null) {
        _showError('Unable to read file');
        setState(() => _isUploading = false);
        return;
      }
      
      final res = await apiService.uploadFile(
        fileData,  // Can be bytes or path
        'assignments',
        fileName: result.files.single.name,
      );
      
      if (res['success'] == true) {
        setState(() {
          _attachments.add({
            'type': 'FILE',
            'url': res['url'],
            'fileName': result.files.single.name,
            'fileSize': result.files.single.size,
            'mimeType': result.files.single.extension,
          });
        });
      }
    }
  } catch (e) {
    _showError('Error uploading file: $e');
  } finally {
    setState(() => _isUploading = false);
  }
}
```

---

## How It Works Now

### Platform Detection
The code automatically detects the platform and uses the appropriate method:

| Platform | File Data Type | Upload Method |
|----------|---------------|---------------|
| **Android/iOS** | `String` (file path) | `MultipartFile.fromPath()` |
| **Web (Chrome/Edge)** | `List<int>` (bytes) | `MultipartFile.fromBytes()` |

### File Picker Behavior
```dart
withData: true  // Ensures bytes are loaded on web
```

- **On Mobile:** `result.files.single.path` is available, `bytes` is null
- **On Web:** `result.files.single.bytes` is available, `path` is null

### Upload Logic
```dart
final fileData = result.files.single.bytes ?? result.files.single.path;

// fileData will be:
// - List<int> on web (bytes)
// - String on mobile (path)
```

---

## Testing

### Test on Web (Chrome/Edge)
1. Run mobile app on Chrome: `flutter run` → Select Chrome
2. Login as teacher
3. Navigate to Create Assignment
4. Tap "Add Attachment"
5. Select a file
6. **File should upload successfully** ✅
7. File appears in attachments list

### Test on Mobile (Android/iOS)
1. Run on physical device or emulator
2. Same steps as above
3. **File should upload successfully** ✅

---

## Files Modified

### Mobile App (2 files)
1. **`mobile_app/lib/services/api_service.dart`**
   - Changed `uploadFile()` signature to accept `dynamic fileData`
   - Added platform detection (String vs List<int>)
   - Use `fromPath()` for mobile, `fromBytes()` for web

2. **`mobile_app/lib/screens/teacher/create_assignment_screen.dart`**
   - Removed `import 'dart:io'` (not web-compatible)
   - Added `withData: true` to FilePicker
   - Use `bytes ?? path` to get file data
   - Pass file name to upload function

---

## Technical Details

### Why This Happens

Flutter apps can run on multiple platforms:
- **Mobile (Android/iOS):** Has file system access via `dart:io`
- **Web (Chrome/Edge/Safari):** No file system access, uses browser APIs
- **Desktop (Windows/macOS/Linux):** Has file system access via `dart:io`

When running on web:
- `dart:io` library is not available
- Files are accessed through browser's File API
- Files are read as bytes (Uint8List)
- No file paths exist

### MultipartFile Methods

```dart
// Mobile/Desktop - requires dart:io
MultipartFile.fromPath('file', '/path/to/file.pdf')

// Web - works everywhere
MultipartFile.fromBytes('file', [bytes], filename: 'file.pdf')
```

### File Picker Package

The `file_picker` package handles platform differences:
- Provides `bytes` on web
- Provides `path` on mobile/desktop
- Setting `withData: true` ensures bytes are loaded

---

## Benefits

### ✅ Cross-Platform Compatibility
- Works on Android, iOS, Web, Desktop
- Single codebase for all platforms
- No conditional imports needed

### ✅ Automatic Platform Detection
- No manual platform checks
- Uses runtime type checking
- Seamless user experience

### ✅ Maintains Existing Functionality
- Mobile apps still use efficient file paths
- Web apps use bytes (only option)
- No performance impact

---

## Summary

The file upload feature now works on all Flutter platforms:
- ✅ **Web (Chrome/Edge):** Uses bytes with `MultipartFile.fromBytes()`
- ✅ **Mobile (Android/iOS):** Uses file paths with `MultipartFile.fromPath()`
- ✅ **Desktop:** Uses file paths with `MultipartFile.fromPath()`

Teachers can now upload assignment attachments from any platform, including when testing the mobile app in a web browser.
