import 'dart:convert';
import 'package:http/http.dart' as http;
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
      final response = await http.get(
        Uri.parse('$_baseUrl$endpoint'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load data: ${response.statusCode}');
      }
    } catch (e) {
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
  Future<Map<String, dynamic>> getHomework({String? studentId, bool upcoming = false}) async {
    String endpoint = '/api/institution/homework?';
    if (upcoming) endpoint += 'upcoming=true&';
    if (studentId != null) endpoint += 'studentId=$studentId';
    return await get(endpoint);
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
  Future<Map<String, dynamic>> getResources() async {
    return await get('/api/institution/resources');
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
}
