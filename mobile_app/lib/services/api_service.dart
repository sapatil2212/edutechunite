import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' as http_parser;
import 'auth_service.dart';

class ApiService {
  final AuthService _authService;

  ApiService(this._authService);

  String get _baseUrl => AuthService.baseUrl;

  Map<String, String> get _headers => {
    'Authorization': 'Bearer ${_authService.user?.token}',
    'Content-Type': 'application/json',
  };

  // Generic GET method
  Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final url = '$_baseUrl$endpoint';
      print('GET Request to: $url');
      final response = await http.get(
        Uri.parse(url),
        headers: _headers,
      );

      print('Response Status: ${response.statusCode}');
      if (response.statusCode != 200) {
        print('Response Body: ${response.body}');
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load data: ${response.statusCode}');
      }
    } catch (e) {
      print('Network Error in GET $endpoint: $e');
      throw Exception('Network error: $e');
    }
  }

  // Generic POST method
  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl$endpoint'),
        headers: _headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to post data: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Generic PUT method
  Future<Map<String, dynamic>> put(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl$endpoint'),
        headers: _headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to update data: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Attendance APIs
  Future<Map<String, dynamic>> getAttendance({String? studentId, String? month}) async {
    String endpoint = '/api/institution/attendance?';
    if (studentId != null) endpoint += 'studentId=$studentId&';
    if (month != null) endpoint += 'month=$month';
    return await get(endpoint);
  }

  // Homework APIs
  Future<Map<String, dynamic>> getAssignments({
    String? studentId,
    bool upcoming = false,
    String? academicYearId,
    String? academicUnitId,
    String? subjectId,
    String? status,
    String? type,
    int page = 1,
    int limit = 20,
  }) async {
    String endpoint = '/api/institution/assignments?page=$page&limit=$limit';
    
    // Add parameters if they exist
    if (upcoming) endpoint += '&upcoming=true';
    if (studentId != null) endpoint += '&studentId=$studentId';
    if (academicYearId != null) endpoint += '&academicYearId=$academicYearId';
    if (academicUnitId != null) endpoint += '&academicUnitId=$academicUnitId';
    if (subjectId != null) endpoint += '&subjectId=$subjectId';
    if (status != null) endpoint += '&status=$status';
    if (type != null) endpoint += '&type=$type';
    
    return await get(endpoint);
  }


  // Alias for backward compatibility if needed, or just replace usages
  Future<Map<String, dynamic>> getHomework({String? studentId, bool upcoming = false}) async {
    return getAssignments(studentId: studentId, upcoming: upcoming);
  }

  Future<Map<String, dynamic>> getAssignmentDetails(String id) async {
    final response = await get('/api/institution/assignments/$id');
    if (response['assignment'] != null) {
      return {
        'success': true,
        'data': response['assignment'],
      };
    }
    return response;
  }

  Future<Map<String, dynamic>> submitAssignment(String id, Map<String, dynamic> data) async {
    return await post('/api/institution/assignments/$id/submissions', data);
  }

  Future<Map<String, dynamic>> getAssignmentSubmissions(String id) async {
    return await get('/api/institution/assignments/$id/submissions');
  }

  Future<Map<String, dynamic>> evaluateSubmission(String assignmentId, Map<String, dynamic> data) async {
    return await post('/api/institution/assignments/$assignmentId/evaluate', data);
  }

  Future<Map<String, dynamic>> evaluateAssignment(String assignmentId, Map<String, dynamic> data) async {
    return await post('/api/institution/assignments/$assignmentId/evaluate', data);
  }

  // Exams APIs
  Future<Map<String, dynamic>> getExams({bool upcoming = false}) async {
    String endpoint = '/api/institution/exams?';
    if (upcoming) endpoint += 'upcoming=true';
    return await get(endpoint);
  }

  // Notices APIs
  Future<Map<String, dynamic>> getNotices({int limit = 20}) async {
    return await get('/api/institution/notices?limit=$limit');
  }

  // Results APIs
  Future<Map<String, dynamic>> getResults({String? studentId}) async {
    String endpoint = '/api/institution/results?';
    if (studentId != null) endpoint += 'studentId=$studentId';
    return await get(endpoint);
  }

  // Timetable APIs
  Future<Map<String, dynamic>> getTimetable({String? academicUnitId}) async {
    String endpoint = '/api/institution/timetable/my-schedule';
    if (academicUnitId != null) endpoint += '?academicUnitId=$academicUnitId';
    return await get(endpoint);
  }

  // Student Profile API
  Future<Map<String, dynamic>> getStudentProfile(String studentId) async {
    return await get('/api/institution/students/$studentId');
  }

  // Parent - Get Children
  Future<Map<String, dynamic>> getChildren() async {
    return await get('/api/institution/parent/children');
  }

  // Fees APIs
  Future<Map<String, dynamic>> getFees({String? studentId}) async {
    String endpoint = '/api/institution/fees?';
    if (studentId != null) endpoint += 'studentId=$studentId';
    return await get(endpoint);
  }

  // Leave Request APIs
  Future<Map<String, dynamic>> getLeaveRequests({String? studentId}) async {
    String endpoint = '/api/institution/leave?';
    if (studentId != null) endpoint += 'studentId=$studentId';
    return await get(endpoint);
  }

  Future<Map<String, dynamic>> createLeaveRequest(Map<String, dynamic> data) async {
    return await post('/api/institution/leave', data);
  }

  // Resources APIs
  // Removed duplicate getResources without parameters


  // Teacher APIs
  Future<Map<String, dynamic>> getTeacherClasses() async {
    // This endpoint should return classes assigned to the teacher
    return await get('/api/institution/teachers/my-classes');
  }

  Future<Map<String, dynamic>> getStudentsForClass(String classId) async {
    return await get('/api/institution/teachers/my-classes/$classId/students');
  }

  Future<Map<String, dynamic>> submitAttendance(String classId, String date, List<Map<String, dynamic>> attendance) async {
    return await post('/api/institution/teachers/my-classes/$classId/attendance', {
      'date': date,
      'attendance': attendance,
    });
  }

  Future<Map<String, dynamic>> getAttendanceReport(String classId, String range) async {
    return await get('/api/institution/teachers/attendance/report?classId=$classId&range=$range');
  }

  Future<Map<String, dynamic>> getTeacherDashboardStats() async {
    return await get('/api/institution/dashboard/teacher-stats');
  }

  // Subjects APIs
  Future<Map<String, dynamic>> getSubjects({String? academicUnitId}) async {
    String endpoint = '/api/institution/subjects?';
    if (academicUnitId != null) endpoint += 'academicUnitId=$academicUnitId';
    return await get(endpoint);
  }

  // Profile APIs
  Future<Map<String, dynamic>> getProfile() async {
    return await get('/api/institution/profile');
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    return await put('/api/institution/profile', data);
  }

  // Teacher Profile APIs
  Future<Map<String, dynamic>> getTeacherProfile() async {
    return await get('/api/institution/teachers/me');
  }

  Future<Map<String, dynamic>> updateTeacherProfile(Map<String, dynamic> data) async {
    return await put('/api/institution/teachers/me', data);
  }


  Future<Map<String, dynamic>> createAssignment(Map<String, dynamic> data) async {
    return await post('/api/institution/assignments', data);
  }

  Future<Map<String, dynamic>> updateAssignment(String id, Map<String, dynamic> data) async {
    return await put('/api/institution/assignments/$id', data);
  }

  Future<Map<String, dynamic>> deleteAssignment(String id) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/api/institution/assignments/$id'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to delete assignment: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<Map<String, dynamic>> uploadFile(dynamic fileData, String folder, {String? fileName}) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/api/institution/upload'),
      );
      request.headers.addAll(_headers);
      
      // Handle both file path (mobile) and bytes (web)
      if (fileData is String) {
        // Mobile: file path
        request.files.add(await http.MultipartFile.fromPath('file', fileData));
      } else if (fileData is List<int>) {
        // Web: bytes - need to determine MIME type from filename
        String? contentType;
        if (fileName != null) {
          final ext = fileName.toLowerCase().split('.').last;
          final mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'zip': 'application/zip',
          };
          contentType = mimeTypes[ext];
        }
        
        request.files.add(http.MultipartFile.fromBytes(
          'file',
          fileData,
          filename: fileName ?? 'file',
          contentType: contentType != null ? http_parser.MediaType.parse(contentType) : null,
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
    } catch (e) {
      throw Exception('Network error during upload: $e');
    }
  }

  // Resources APIs
  Future<Map<String, dynamic>> getResources({
    String? academicUnitId,
    String? subjectId,
    String? type,
    int page = 1,
    int limit = 20,
  }) async {
    String endpoint = '/api/institution/resources?page=$page&limit=$limit';
    if (academicUnitId != null) endpoint += '&academicUnitId=$academicUnitId';
    if (subjectId != null) endpoint += '&subjectId=$subjectId';
    if (type != null) endpoint += '&type=$type';
    return await get(endpoint);
  }

  Future<Map<String, dynamic>> createResource(Map<String, dynamic> data) async {
    return await post('/api/institution/resources', data);
  }

  // Academic Structure APIs
  Future<Map<String, dynamic>> getAcademicYears() async {
    return await get('/api/institution/academic-years');
  }

  Future<Map<String, dynamic>> getAcademicUnits({
    String? academicYearId,
    String? parentId,
    bool includeChildren = false,
  }) async {
    String endpoint = '/api/institution/academic-units?';
    if (academicYearId != null) endpoint += 'academicYearId=$academicYearId&';
    if (parentId != null) endpoint += 'parentId=$parentId&';
    if (includeChildren) endpoint += 'includeChildren=true';
    return await get(endpoint);
  }
}
