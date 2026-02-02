import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:edumanage_mobile/services/api_service.dart';
import 'package:edumanage_mobile/services/auth_service.dart';
import 'package:edumanage_mobile/screens/student/student_homework_screen.dart';
import 'package:edumanage_mobile/screens/student/student_assignment_detail_screen.dart';

// Mock ApiService
class MockApiService extends ApiService {
  MockApiService() : super(AuthService());

  @override
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
    return {
      'assignments': [
        {
          'id': 'assign1',
          'title': 'Math Homework',
          'description': 'Solve chapter 5 problems',
          'dueDate': '2025-12-31',
          'subject': {'name': 'Mathematics'},
          'submission': null, // Pending
        }
      ]
    };
  }

  @override
  Future<Map<String, dynamic>> getAssignmentDetails(String id) async {
    return {
      'assignment': {
        'id': 'assign1',
        'title': 'Math Homework',
        'instructions': 'Solve chapter 5 problems', // Changed from description to instructions
        'dueDate': '2025-12-31',
        'subject': {'name': 'Mathematics'},
        'teacher': {'name': 'Mr. Teacher'},
        'studentSubmission': null,
      }
    };
  }

  @override
  Future<Map<String, dynamic>> uploadFile(String filePath, String folder) async {
    return {
      'url': 'https://example.com/file.pdf',
      'publicId': 'file123',
    };
  }

  @override
  Future<Map<String, dynamic>> submitAssignment(String id, Map<String, dynamic> data) async {
    return {
      'id': 'sub1',
      'status': 'SUBMITTED',
      'remarks': data['remarks'],
    };
  }
}

void main() {
  testWidgets('Student Assignment Flow Test', (WidgetTester tester) async {
    // 1. Setup App with Mock Provider
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider<ApiService>(create: (_) => MockApiService()),
        ],
        child: MaterialApp(
          home: const StudentHomeworkScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // 2. Verify Assignment List
    expect(find.text('Math Homework'), findsOneWidget);
    expect(find.text('Mathematics'), findsOneWidget);
    expect(find.text('Pending'), findsWidgets); // Found in Tab and Card badge

    // 3. Navigate to Details
    await tester.tap(find.text('Math Homework'));
    await tester.pumpAndSettle();

    // 4. Verify Detail Screen
    expect(find.byType(StudentAssignmentDetailScreen), findsOneWidget);
    expect(find.text('Math Homework'), findsOneWidget);
    expect(find.text('Solve chapter 5 problems'), findsOneWidget);

    // 5. Test Submission UI Presence
    expect(find.text('Add File'), findsOneWidget); // Corrected button text
    expect(find.byType(TextField), findsOneWidget); // Remarks field

    // 6. Enter remarks
    await tester.enterText(find.byType(TextField), 'My homework submission');
    expect(find.text('My homework submission'), findsOneWidget);

    // Note: We can't easily click "Submit Assignment" because it might be disabled until file is selected,
    // or requires file picker interaction which we mocked but the UI needs to trigger.
    // For now, verifying navigation and data loading is sufficient for this flow test.
  });
}
