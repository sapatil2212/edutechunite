import 'package:flutter/material.dart';
import '../../../services/api_service.dart';
import '../../../widgets/common/loading_widget.dart';
import 'exam_schedule_screen.dart';
import 'marks_entry_screen.dart';
import 'exam_results_screen.dart';
import 'exam_analytics_screen.dart';

class TeacherExamsScreen extends StatefulWidget {
  const TeacherExamsScreen({Key? key}) : super(key: key);

  @override
  State<TeacherExamsScreen> createState() => _TeacherExamsScreenState();
}

class _TeacherExamsScreenState extends State<TeacherExamsScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _summary;
  List<dynamic> _recentExams = [];

  @override
  void initState() {
    super.initState();
    _fetchExamSummary();
  }

  Future<void> _fetchExamSummary() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/teacher/exams/summary');
      if (response['success'] == true) {
        setState(() {
          _summary = response['summary'];
          _recentExams = response['recentExams'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching exam summary: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam Management'),
        elevation: 0,
      ),
      body: _isLoading
          ? const LoadingWidget()
          : RefreshIndicator(
              onRefresh: _fetchExamSummary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Summary Cards
                    _buildSummaryCards(),
                    const SizedBox(height: 24),

                    // Quick Actions
                    const Text(
                      'Quick Actions',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildQuickActions(),
                    const SizedBox(height: 24),

                    // Recent Exams
                    const Text(
                      'Recent Exams',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildRecentExams(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryCards() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildSummaryCard(
          'Total Exams',
          '${_summary?['totalExams'] ?? 0}',
          Icons.book_outlined,
          Colors.blue,
        ),
        _buildSummaryCard(
          'Upcoming',
          '${_summary?['upcomingExams'] ?? 0}',
          Icons.calendar_today,
          Colors.green,
        ),
        _buildSummaryCard(
          'Completed',
          '${_summary?['completedExams'] ?? 0}',
          Icons.check_circle_outline,
          Colors.purple,
        ),
        _buildSummaryCard(
          'Pending Marks',
          '${_summary?['pendingMarksEntry'] ?? 0}',
          Icons.edit_note,
          Colors.orange,
        ),
      ],
    );
  }

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
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
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2.5,
      children: [
        _buildActionButton(
          'Exam Schedule',
          Icons.calendar_month,
          Colors.blue,
          () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ExamScheduleScreen()),
          ),
        ),
        _buildActionButton(
          'Marks Entry',
          Icons.edit,
          Colors.orange,
          () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const MarksEntryScreen()),
          ),
        ),
        _buildActionButton(
          'Results',
          Icons.emoji_events,
          Colors.green,
          () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ExamResultsScreen()),
          ),
        ),
        _buildActionButton(
          'Analytics',
          Icons.analytics,
          Colors.purple,
          () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ExamAnalyticsScreen()),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: color,
                  fontSize: 13,
                ),
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: color, size: 14),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentExams() {
    if (_recentExams.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Column(
            children: [
              Icon(Icons.book_outlined, size: 48, color: Colors.grey),
              SizedBox(height: 8),
              Text(
                'No exams found',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _recentExams.length,
      itemBuilder: (context, index) {
        final exam = _recentExams[index];
        return _buildExamCard(exam);
      },
    );
  }

  Widget _buildExamCard(Map<String, dynamic> exam) {
    final status = exam['status'] ?? 'DRAFT';
    final statusColor = _getStatusColor(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  exam['name'] ?? 'Exam',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  status.replaceAll('_', ' '),
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.calendar_today, size: 14, color: Colors.grey[600]),
              const SizedBox(width: 4),
              Text(
                '${_formatDate(exam['startDate'])} - ${_formatDate(exam['endDate'])}',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.list_alt, size: 14, color: Colors.grey[600]),
              const SizedBox(width: 4),
              Text(
                '${exam['schedulesCount'] ?? 0} schedules',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'SCHEDULED':
        return Colors.blue;
      case 'ONGOING':
        return Colors.orange;
      case 'COMPLETED':
      case 'RESULTS_PUBLISHED':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }
}
