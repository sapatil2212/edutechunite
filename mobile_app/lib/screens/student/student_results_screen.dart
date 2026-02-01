import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_drawer.dart';

class StudentResultsScreen extends StatefulWidget {
  const StudentResultsScreen({super.key});

  @override
  State<StudentResultsScreen> createState() => _StudentResultsScreenState();
}

class _StudentResultsScreenState extends State<StudentResultsScreen> {
  bool _isLoading = true;
  List<dynamic> _results = [];

  @override
  void initState() {
    super.initState();
    _fetchResults();
  }

  Future<void> _fetchResults() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final data = await apiService.getResults();

      setState(() {
        _results = data['results'] as List? ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        // Mock data for preview if API fails
        setState(() {
          _results = [
            {
              'examName': 'Mid Term Examination',
              'date': '2025-10-15',
              'score': '85%',
              'grade': 'A',
              'subjects': [
                {'name': 'Mathematics', 'score': 90, 'total': 100, 'grade': 'A+'},
                {'name': 'Physics', 'score': 85, 'total': 100, 'grade': 'A'},
                {'name': 'Chemistry', 'score': 78, 'total': 100, 'grade': 'B+'},
                {'name': 'English', 'score': 88, 'total': 100, 'grade': 'A'},
                {'name': 'Computer Science', 'score': 95, 'total': 100, 'grade': 'O'},
              ]
            },
            {
              'examName': 'Unit Test 1',
              'date': '2025-08-20',
              'score': '78%',
              'grade': 'B+',
              'subjects': [
                {'name': 'Mathematics', 'score': 80, 'total': 100, 'grade': 'A'},
                {'name': 'Physics', 'score': 75, 'total': 100, 'grade': 'B+'},
                {'name': 'Chemistry', 'score': 70, 'total': 100, 'grade': 'B'},
              ]
            }
          ];
          _isLoading = false;
        });
      }
    }
  }

  Color _getGradeColor(String grade) {
    switch (grade.toUpperCase()) {
      case 'O':
      case 'A+':
      case 'A':
        return Colors.green;
      case 'B+':
      case 'B':
        return Colors.blue;
      case 'C+':
      case 'C':
        return Colors.orange;
      default:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      drawer: const AppDrawer(currentRoute: '/results'),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Colors.black),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: const Text(
          'Results',
          style: TextStyle(color: Color(0xFF0A0A0A), fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _results.length,
              itemBuilder: (context, index) {
                final result = _results[index];
                return _buildResultCard(result);
              },
            ),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> result) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.all(20),
          childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                result['examName'] ?? 'Exam Result',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                result['date'] ?? '',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _getGradeColor(result['grade'] ?? 'F').withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              result['grade'] ?? 'N/A',
              style: TextStyle(
                color: _getGradeColor(result['grade'] ?? 'F'),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          children: [
            Container(
              height: 1,
              color: Colors.grey.shade100,
              margin: const EdgeInsets.only(bottom: 16),
            ),
            ...((result['subjects'] as List? ?? []).map<Widget>((subject) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      subject['name'] ?? '',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF4B5563),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Row(
                      children: [
                        Text(
                          '${subject['score']}/${subject['total']}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getGradeColor(subject['grade'] ?? 'F').withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            subject['grade'] ?? '-',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: _getGradeColor(subject['grade'] ?? 'F'),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList()),
          ],
        ),
      ),
    );
  }
}
