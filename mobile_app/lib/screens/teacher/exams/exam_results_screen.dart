import 'package:flutter/material.dart';
import '../../../services/api_service.dart';
import '../../../widgets/common/loading_widget.dart';

class ExamResultsScreen extends StatefulWidget {
  const ExamResultsScreen({Key? key}) : super(key: key);

  @override
  State<ExamResultsScreen> createState() => _ExamResultsScreenState();
}

class _ExamResultsScreenState extends State<ExamResultsScreen> {
  bool _isLoading = true;
  List<dynamic> _results = [];
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchResults();
  }

  Future<void> _fetchResults() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/teacher/exam-results');
      if (response['success'] == true) {
        setState(() {
          _results = response['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching results: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<dynamic> get _filteredResults {
    if (_filter == 'all') return _results;
    return _results.where((result) {
      final status = result['exam']?['status'] ?? '';
      if (_filter == 'published') {
        return status == 'RESULTS_PUBLISHED';
      } else if (_filter == 'pending') {
        return status != 'RESULTS_PUBLISHED';
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam Results'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                _buildFilterChip('All', 'all'),
                const SizedBox(width: 8),
                _buildFilterChip('Published', 'published'),
                const SizedBox(width: 8),
                _buildFilterChip('Pending', 'pending'),
              ],
            ),
          ),

          // Results List
          Expanded(
            child: _isLoading
                ? const LoadingWidget()
                : RefreshIndicator(
                    onRefresh: _fetchResults,
                    child: _filteredResults.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredResults.length,
                            itemBuilder: (context, index) {
                              return _buildResultCard(_filteredResults[index]);
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _filter = value);
      },
      selectedColor: Theme.of(context).primaryColor.withOpacity(0.2),
      checkmarkColor: Theme.of(context).primaryColor,
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.emoji_events_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No exam results found',
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> result) {
    final exam = result['exam'] ?? {};
    final subject = result['subject'] ?? {};
    final academicUnit = result['academicUnit'] ?? {};
    final stats = result['stats'] ?? {};
    final status = exam['status'] ?? 'PENDING';
    final isPublished = status == 'RESULTS_PUBLISHED';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isPublished
                  ? Colors.green.withOpacity(0.1)
                  : Colors.orange.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        exam['name'] ?? 'Exam',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        '${subject['name']} • ${academicUnit['name']}',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isPublished ? Colors.green : Colors.orange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isPublished ? 'Published' : 'Pending',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Stats Grid
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    _buildStatBox('Total', '${stats['totalStudents'] ?? 0}', Colors.blue),
                    const SizedBox(width: 8),
                    _buildStatBox('Passed', '${stats['passed'] ?? 0}', Colors.green),
                    const SizedBox(width: 8),
                    _buildStatBox('Failed', '${stats['failed'] ?? 0}', Colors.red),
                    const SizedBox(width: 8),
                    _buildStatBox('Absent', '${stats['absent'] ?? 0}', Colors.grey),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildMetricCard(
                      'Average',
                      '${(stats['averageMarks'] ?? 0).toStringAsFixed(1)}',
                      Icons.trending_up,
                      Colors.blue,
                    ),
                    const SizedBox(width: 8),
                    _buildMetricCard(
                      'Highest',
                      '${stats['highestMarks'] ?? 0}',
                      Icons.emoji_events,
                      Colors.green,
                    ),
                    const SizedBox(width: 8),
                    _buildMetricCard(
                      'Pass %',
                      '${(stats['passPercentage'] ?? 0).toStringAsFixed(1)}%',
                      Icons.percent,
                      Colors.orange,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: Colors.grey[200]!),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      _showStudentResults(result);
                    },
                    icon: const Icon(Icons.visibility, size: 18),
                    label: const Text('View Details'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Download feature coming soon')),
                    );
                  },
                  icon: const Icon(Icons.download),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.grey[100],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatBox(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 10,
                      color: color,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showStudentResults(Map<String, dynamic> result) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => StudentResultsDetailScreen(scheduleId: result['id']),
      ),
    );
  }
}

class StudentResultsDetailScreen extends StatefulWidget {
  final String scheduleId;

  const StudentResultsDetailScreen({Key? key, required this.scheduleId}) : super(key: key);

  @override
  State<StudentResultsDetailScreen> createState() => _StudentResultsDetailScreenState();
}

class _StudentResultsDetailScreenState extends State<StudentResultsDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _schedule;
  List<dynamic> _results = [];

  @override
  void initState() {
    super.initState();
    _fetchResults();
  }

  Future<void> _fetchResults() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/teacher/exam-schedules/${widget.scheduleId}/results');
      if (response['success'] == true) {
        final data = response['data'];
        setState(() {
          _schedule = data['schedule'];
          _results = data['results'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching results: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_schedule != null
            ? '${_schedule!['exam']?['name']} - ${_schedule!['subject']?['name']}'
            : 'Results'),
        elevation: 0,
      ),
      body: _isLoading
          ? const LoadingWidget()
          : _results.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No results found',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _results.length,
                  itemBuilder: (context, index) {
                    return _buildStudentResultCard(_results[index], index);
                  },
                ),
    );
  }

  Widget _buildStudentResultCard(Map<String, dynamic> result, int index) {
    final student = result['student'] ?? {};
    final isAbsent = result['isAbsent'] ?? false;
    final isPassed = result['isPassed'] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isAbsent
              ? Colors.grey.withOpacity(0.3)
              : (isPassed ? Colors.green : Colors.red).withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          // Rank
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                student['rollNumber'] ?? '${index + 1}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Student Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student['fullName'] ?? 'Student',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  student['admissionNumber'] ?? '',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ],
            ),
          ),

          // Marks
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                isAbsent ? 'AB' : '${result['marksObtained']}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: isAbsent ? Colors.grey : (isPassed ? Colors.green : Colors.red),
                ),
              ),
              Text(
                isAbsent
                    ? 'Absent'
                    : '${(result['percentage'] ?? 0).toStringAsFixed(1)}%',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 11,
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),

          // Grade Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isAbsent
                  ? Colors.grey.withOpacity(0.1)
                  : (isPassed ? Colors.green : Colors.red).withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              isAbsent ? '-' : (result['grade'] ?? 'F'),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isAbsent ? Colors.grey : (isPassed ? Colors.green : Colors.red),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
