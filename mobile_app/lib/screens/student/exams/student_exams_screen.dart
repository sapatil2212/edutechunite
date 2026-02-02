import 'package:flutter/material.dart';
import '../../../services/api_service.dart';
import '../../../widgets/common/loading_widget.dart';

class StudentExamsScreen extends StatefulWidget {
  const StudentExamsScreen({Key? key}) : super(key: key);

  @override
  State<StudentExamsScreen> createState() => _StudentExamsScreenState();
}

class _StudentExamsScreenState extends State<StudentExamsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<dynamic> _exams = [];
  List<dynamic> _schedules = [];
  List<dynamic> _hallTickets = [];
  List<dynamic> _results = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _fetchAllData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchAllData() async {
    setState(() => _isLoading = true);
    try {
      final responses = await Future.wait([
        ApiService.get('/student/exams'),
        ApiService.get('/student/exam-schedules'),
        ApiService.get('/student/hall-tickets'),
        ApiService.get('/student/exam-results'),
      ]);

      setState(() {
        _exams = responses[0]['data'] ?? [];
        _schedules = responses[1]['data'] ?? [];
        _hallTickets = responses[2]['data'] ?? [];
        _results = responses[3]['data'] ?? [];
      });
    } catch (e) {
      debugPrint('Error fetching exam data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Exams'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Schedule'),
            Tab(text: 'Hall Tickets'),
            Tab(text: 'Results'),
          ],
        ),
      ),
      body: _isLoading
          ? const LoadingWidget()
          : RefreshIndicator(
              onRefresh: _fetchAllData,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildUpcomingExams(),
                  _buildExamSchedule(),
                  _buildHallTickets(),
                  _buildResults(),
                ],
              ),
            ),
    );
  }

  Widget _buildUpcomingExams() {
    final upcomingExams = _exams.where((exam) {
      final status = exam['status'] ?? '';
      return status == 'SCHEDULED' || status == 'ONGOING';
    }).toList();

    if (upcomingExams.isEmpty) {
      return _buildEmptyState(
        Icons.calendar_today,
        'No upcoming exams',
        'Your upcoming exams will appear here',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: upcomingExams.length,
      itemBuilder: (context, index) {
        return _buildExamCard(upcomingExams[index]);
      },
    );
  }

  Widget _buildExamCard(Map<String, dynamic> exam) {
    final status = exam['status'] ?? 'DRAFT';
    final statusColor = _getStatusColor(status);

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
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
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
                      if (exam['code'] != null)
                        Text(
                          exam['code'],
                          style: TextStyle(color: Colors.grey[600], fontSize: 12),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    status.replaceAll('_', ' '),
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
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildInfoRow(
                  Icons.category,
                  'Type: ${(exam['examType'] ?? 'EXAM').replaceAll('_', ' ')}',
                ),
                const SizedBox(height: 8),
                _buildInfoRow(
                  Icons.calendar_today,
                  'Start: ${_formatDate(exam['startDate'])}',
                ),
                const SizedBox(height: 8),
                _buildInfoRow(
                  Icons.event,
                  'End: ${_formatDate(exam['endDate'])}',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExamSchedule() {
    if (_schedules.isEmpty) {
      return _buildEmptyState(
        Icons.schedule,
        'No exam schedule',
        'Your exam schedule will appear here',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _schedules.length,
      itemBuilder: (context, index) {
        return _buildScheduleCard(_schedules[index]);
      },
    );
  }

  Widget _buildScheduleCard(Map<String, dynamic> schedule) {
    final subject = schedule['subject'] ?? {};
    final exam = schedule['exam'] ?? {};

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
      child: Row(
        children: [
          Container(
            width: 60,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Text(
                  _getDayOfMonth(schedule['examDate']),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
                Text(
                  _getMonth(schedule['examDate']),
                  style: TextStyle(
                    fontSize: 11,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subject['name'] ?? 'Subject',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                Text(
                  '${subject['code']} • ${exam['name']}',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      '${schedule['startTime']} - ${schedule['endTime']}',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ),
                if (schedule['room'] != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.room, size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        schedule['room'],
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHallTickets() {
    if (_hallTickets.isEmpty) {
      return _buildEmptyState(
        Icons.confirmation_number,
        'No hall tickets',
        'Hall tickets will be available closer to exam date',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _hallTickets.length,
      itemBuilder: (context, index) {
        return _buildHallTicketCard(_hallTickets[index]);
      },
    );
  }

  Widget _buildHallTicketCard(Map<String, dynamic> ticket) {
    final exam = ticket['exam'] ?? {};

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
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.confirmation_number,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(width: 12),
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
                        'Hall Ticket: ${ticket['hallTicketNumber']}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildTicketInfoRow('Exam Center', ticket['examCenter'] ?? 'N/A'),
                _buildTicketInfoRow('Room', ticket['roomNumber'] ?? 'N/A'),
                _buildTicketInfoRow('Seat', ticket['seatNumber'] ?? 'N/A'),
                _buildTicketInfoRow(
                  'Reporting Time',
                  _formatTime(ticket['reportingTime']),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Colors.grey[200]!)),
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _downloadHallTicket(ticket['id']),
                icon: const Icon(Icons.download),
                label: const Text('Download Hall Ticket'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildResults() {
    if (_results.isEmpty) {
      return _buildEmptyState(
        Icons.emoji_events,
        'No results available',
        'Your exam results will appear here once published',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _results.length,
      itemBuilder: (context, index) {
        return _buildResultCard(_results[index]);
      },
    );
  }

  Widget _buildResultCard(Map<String, dynamic> result) {
    final subject = result['subject'] ?? {};
    final examSchedule = result['examSchedule'] ?? {};
    final exam = examSchedule['exam'] ?? {};
    final isPassed = result['isPassed'] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isPassed ? Colors.green.withOpacity(0.3) : Colors.red.withOpacity(0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subject['name'] ?? 'Subject',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  '${subject['code']} • ${exam['name'] ?? 'Exam'}',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${result['marksObtained']} / ${examSchedule['maxMarks'] ?? 100}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: isPassed ? Colors.green : Colors.red,
                ),
              ),
              Text(
                '${(result['percentage'] ?? 0).toStringAsFixed(1)}%',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            ],
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isPassed ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Text(
                  result['grade'] ?? 'F',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isPassed ? Colors.green : Colors.red,
                  ),
                ),
                Text(
                  isPassed ? 'Pass' : 'Fail',
                  style: TextStyle(
                    fontSize: 10,
                    color: isPassed ? Colors.green : Colors.red,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(color: Colors.grey[500], fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Text(text, style: TextStyle(color: Colors.grey[700], fontSize: 13)),
      ],
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

  String _formatTime(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      final hour = date.hour > 12 ? date.hour - 12 : date.hour;
      final period = date.hour >= 12 ? 'PM' : 'AM';
      return '${hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')} $period';
    } catch (e) {
      return dateStr;
    }
  }

  String _getDayOfMonth(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}';
    } catch (e) {
      return '';
    }
  }

  String _getMonth(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[date.month - 1];
    } catch (e) {
      return '';
    }
  }

  Future<void> _downloadHallTicket(String ticketId) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Downloading hall ticket...')),
      );
      
      // Open hall ticket in browser/webview
      final url = '${ApiService.baseUrl}/student/hall-tickets/$ticketId/download';
      // In a real app, you would use url_launcher or webview to open this
      debugPrint('Download URL: $url');
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Hall ticket ready for download'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to download hall ticket'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
