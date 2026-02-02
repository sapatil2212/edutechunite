import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:edumanage_mobile/screens/teacher/teacher_assignments_screen.dart';
import 'package:edumanage_mobile/screens/teacher/assignment_submissions_screen.dart';
import 'package:edumanage_mobile/screens/teacher/submission_evaluation_screen.dart';
import 'package:edumanage_mobile/services/api_service.dart';
import 'package:edumanage_mobile/services/auth_service.dart';

// Mock ApiService
class MockApiService extends ApiService {
  MockApiService(AuthService authService) : super(authService);

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
          'id': '1',
          'title': 'Test Assignment',
          'status': 'PUBLISHED',
          'dueDate': '2025-12-31T23:59:59Z',
          'subject': {'name': 'Math'},
          'academicUnit': {'name': 'Class 10A'},
          'stats': {
            'submitted': 5,
            'totalStudents': 30,
            'evaluated': 2,
          }
        }
      ]
    };
  }

  @override
  Future<Map<String, dynamic>> getAssignmentSubmissions(String id) async {
    return {
      'submissions': [
        {
          'id': 'sub1',
          'status': 'SUBMITTED',
          'submittedAt': '2025-10-10T10:00:00Z',
          'student': {
            'fullName': 'John Doe',
            'admissionNumber': 'A001',
            'user': {'avatar': null}
          },
          'evaluation': null
        }
      ]
    };
  }

  @override
  Future<Map<String, dynamic>> evaluateSubmission(String assignmentId, Map<String, dynamic> data) async {
    // Verify data in test
    print('Evaluated with: $data');
    return {'success': true};
  }
}

void main() {
  testWidgets('Teacher Assignment Flow Test', (WidgetTester tester) async {
    final authService = AuthService();
    final apiService = MockApiService(authService);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: authService),
          Provider<ApiService>.value(value: apiService),
        ],
        child: MaterialApp(
          home: TeacherAssignmentsScreen(),
        ),
      ),
    );

    // 1. Verify Assignment List
    await tester.pumpAndSettle();
    expect(find.text('Test Assignment'), findsOneWidget);
    expect(find.text('Math • Class 10A'), findsOneWidget);
    expect(find.text('5/30'), findsOneWidget); // Submitted stats

    // 2. Navigate to Submissions
    await tester.tap(find.text('Test Assignment'));
    await tester.pumpAndSettle();

    // 3. Verify Submission List
    expect(find.byType(AssignmentSubmissionsScreen), findsOneWidget);
    expect(find.text('John Doe'), findsOneWidget);
    expect(find.text('SUBMITTED'), findsOneWidget);

    // 4. Navigate to Evaluation
    await tester.tap(find.text('John Doe'));
    await tester.pumpAndSettle();

    // 5. Verify Evaluation Screen
    expect(find.byType(SubmissionEvaluationScreen), findsOneWidget);
    expect(find.text('Evaluate Submission'), findsOneWidget);
    expect(find.text('John Doe'), findsOneWidget);

    // 6. Perform Evaluation
    await tester.enterText(find.byType(TextFormField).first, '85'); // Marks
    await tester.enterText(find.byType(TextFormField).last, 'Great job!'); // Feedback
    
    // Scroll down to find the button if needed (though simplistic view usually fits)
    await tester.ensureVisible(find.text('Save Evaluation'));
    await tester.tap(find.text('Save Evaluation'));
    await tester.pumpAndSettle();

    // 7. Verify Success
    expect(find.text('Evaluation saved successfully'), findsOneWidget);
  });
}
