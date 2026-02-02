import 'package:flutter/material.dart';
import '../../../services/api_service.dart';
import '../../../widgets/common/loading_widget.dart';

class ExamScheduleScreen extends StatefulWidget {
  const ExamScheduleScreen({Key? key}) : super(key: key);

  @override
  State<ExamScheduleScreen> createState() => _ExamScheduleScreenState();
}

class _ExamScheduleScreenState extends State<ExamScheduleScreen> {
  bool _isLoading = true;
  List<dynamic> _schedules = [];
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchSchedules();
  }

  Future<void> _fetchSchedules() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/teacher/exam-schedules');
      if (response['success'] == true) {
        setState(() {
          _schedules = response['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching schedules: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<dynamic> get _filteredSchedules {
    if (_filter == 'all') return _schedules;
    
    final now = DateTime.now();
    return _schedules.where((schedule) {
      final examDate = DateTime.tryParse(schedule['examDate'] ?? '');
      if (examDate == null) return false;
      
      if (_filter == 'upcoming') {
        return examDate.isAfter(now);
      } else if (_filter == 'completed') {
        return examDate.isBefore(now);
      } else if (_filter == 'pending') {
        final status = schedule['marksEntryStatus'] ?? '';
        return status == 'NOT_STARTED' || status == 'IN_PROGRESS';
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam Schedule'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            padding: const EdgeInsets.all(12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('All', 'all'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Upcoming', 'upcoming'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Completed', 'completed'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Pending Marks', 'pending'),
                ],
              ),
            ),
          ),

          // Schedule List
          Expanded(
            child: _isLoading
                ? const LoadingWidget()
                : RefreshIndicator(
                    onRefresh: _fetchSchedules,
                    child: _filteredSchedules.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredSchedules.length,
                            itemBuilder: (context, index) {
                              return _buildScheduleCard(_filteredSchedules[index]);
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
          Icon(Icons.calendar_today, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No exam schedules found',
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleCard(Map<String, dynamic> schedule) {
    final subject = schedule['subject'] ?? {};
    final exam = schedule['exam'] ?? {};
    final academicUnit = schedule['academicUnit'] ?? {};
    final status = exam['status'] ?? 'DRAFT';
    final marksStatus = schedule['marksEntryStatus'] ?? 'NOT_STARTED';

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
              color: Theme.of(context).primaryColor.withOpacity(0.1),
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
                        subject['name'] ?? 'Subject',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        '${exam['name']} • ${subject['code']}',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(status),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildInfoRow(
                  Icons.calendar_today,
                  _formatDate(schedule['examDate']),
                ),
                const SizedBox(height: 8),
                _buildInfoRow(
                  Icons.access_time,
                  '${schedule['startTime']} - ${schedule['endTime']} (${schedule['duration']} mins)',
                ),
                const SizedBox(height: 8),
                _buildInfoRow(
                  Icons.people,
                  academicUnit['name'] ?? 'Class',
                ),
                const SizedBox(height: 12),

                // Marks Info
                Row(
                  children: [
                    Expanded(
                      child: _buildMarksBadge('Max', '${schedule['maxMarks']}'),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildMarksBadge('Pass', '${schedule['passingMarks']}'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Marks Entry Status
                Row(
                  children: [
                    const Text(
                      'Marks Entry: ',
                      style: TextStyle(fontSize: 12),
                    ),
                    _buildMarksStatusBadge(marksStatus),
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
                      Navigator.pushNamed(
                        context,
                        '/teacher/marks-entry',
                        arguments: {'scheduleId': schedule['id']},
                      );
                    },
                    icon: const Icon(Icons.edit, size: 18),
                    label: const Text('Enter Marks'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: () {
                    // View details
                  },
                  icon: const Icon(Icons.visibility),
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

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(color: Colors.grey[700], fontSize: 13),
        ),
      ],
    );
  }

  Widget _buildMarksBadge(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(color: Colors.grey[600], fontSize: 11),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    switch (status) {
      case 'SCHEDULED':
        color = Colors.blue;
        break;
      case 'ONGOING':
        color = Colors.orange;
        break;
      case 'COMPLETED':
      case 'RESULTS_PUBLISHED':
        color = Colors.green;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildMarksStatusBadge(String status) {
    Color color;
    switch (status) {
      case 'NOT_STARTED':
        color = Colors.grey;
        break;
      case 'IN_PROGRESS':
        color = Colors.orange;
        break;
      case 'COMPLETED':
        color = Colors.green;
        break;
      case 'LOCKED':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${weekdays[date.weekday - 1]}, ${date.day} ${months[date.month - 1]} ${date.year}';
    } catch (e) {
      return dateStr;
    }
  }
}
