
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class MarkAttendanceScreen extends StatefulWidget {
  final String classId;
  final String className;
  final String subjectName;

  const MarkAttendanceScreen({
    super.key,
    required this.classId,
    required this.className,
    required this.subjectName,
  });

  @override
  State<MarkAttendanceScreen> createState() => _MarkAttendanceScreenState();
}

class _MarkAttendanceScreenState extends State<MarkAttendanceScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  List<dynamic> _students = [];
  Map<String, String> _attendanceStatus = {}; // studentId -> status
  Map<String, String> _remarks = {}; // studentId -> remark
  DateTime _selectedDate = DateTime.now();

  final List<String> _statusOptions = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
  final Map<String, Color> _statusColors = {
    'PRESENT': Colors.green,
    'ABSENT': Colors.red,
    'LATE': Colors.orange,
    'EXCUSED': Colors.blue,
  };

  @override
  void initState() {
    super.initState();
    _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final response = await apiService.getStudentsForClass(widget.classId);
      print('Students API Response: $response'); // Debug
      
      if (mounted) {
        setState(() {
          if (response['data'] != null && response['data']['students'] != null) {
            _students = response['data']['students'];
          } else {
            _students = [];
            print('Warning: No students found in response data');
          }
          
          // Initialize all as PRESENT by default
          for (var student in _students) {
            _attendanceStatus[student['id']] = 'PRESENT';
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error fetching students: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load students: $e')),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _submitAttendance() async {
    if (_isSubmitting) return;

    setState(() => _isSubmitting = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      final attendanceList = _students.map((student) {
        return {
          'studentId': student['id'],
          'status': _attendanceStatus[student['id']] ?? 'PRESENT',
          'remarks': _remarks[student['id']] ?? '',
        };
      }).toList();

      await apiService.submitAttendance(
        widget.classId,
        DateFormat('yyyy-MM-dd').format(_selectedDate),
        attendanceList,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Attendance submitted successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      print('Error submitting attendance: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit attendance: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF1F2937), // Header background color
              onPrimary: Colors.white, // Header text color
              onSurface: Color(0xFF1F2937), // Body text color
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  void _markAll(String status) {
    setState(() {
      for (var student in _students) {
        _attendanceStatus[student['id']] = status;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Mark Attendance',
              style: const TextStyle(
                color: Color(0xFF1F2937),
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '${widget.className} • ${widget.subjectName}',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1F2937)),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () => _selectDate(context),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFEDF874)))
          : Column(
              children: [
                // Date and Stats Header
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        DateFormat('EEEE, MMM d').format(_selectedDate),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      Row(
                        children: [
                          _buildStatusChip('P', _countStatus('PRESENT'), Colors.green),
                          const SizedBox(width: 8),
                          _buildStatusChip('A', _countStatus('ABSENT'), Colors.red),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Quick Actions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _markAll('PRESENT'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.green,
                            side: const BorderSide(color: Colors.green),
                          ),
                          child: const Text('Mark All Present'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _markAll('ABSENT'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            side: const BorderSide(color: Colors.red),
                          ),
                          child: const Text('Mark All Absent'),
                        ),
                      ),
                    ],
                  ),
                ),

                // Student List
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _students.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final student = _students[index];
                      final status = _attendanceStatus[student['id']] ?? 'PRESENT';
                      
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 5,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 20,
                                  backgroundColor: const Color(0xFFEDF874),
                                  backgroundImage: student['profilePhoto'] != null
                                      ? NetworkImage(student['profilePhoto'])
                                      : null,
                                  child: student['profilePhoto'] == null
                                      ? Text(
                                          (student['firstName']?[0] ?? 'S').toUpperCase(),
                                          style: const TextStyle(
                                            color: Color(0xFF1F2937),
                                            fontWeight: FontWeight.bold,
                                          ),
                                        )
                                      : null,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${student['firstName']} ${student['lastName'] ?? ''}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                          color: Color(0xFF1F2937),
                                        ),
                                      ),
                                      Text(
                                        'Roll No: ${student['rollNumber'] ?? '-'}',
                                        style: TextStyle(
                                          color: Colors.grey[500],
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: _statusOptions.map((option) {
                                  final isSelected = status == option;
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: InkWell(
                                      onTap: () {
                                        setState(() {
                                          _attendanceStatus[student['id']] = option;
                                        });
                                      },
                                      borderRadius: BorderRadius.circular(20),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? _statusColors[option]
                                              : Colors.grey[100],
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(
                                            color: isSelected
                                                ? _statusColors[option]!
                                                : Colors.transparent,
                                          ),
                                        ),
                                        child: Text(
                                          option,
                                          style: TextStyle(
                                            color: isSelected
                                                ? Colors.white
                                                : Colors.grey[600],
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Submit Button
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitAttendance,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEDF874),
                        foregroundColor: const Color(0xFF1F2937),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Color(0xFF1F2937),
                              ),
                            )
                          : const Text(
                              'Submit Attendance',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildStatusChip(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '$label: $count',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  int _countStatus(String status) {
    return _attendanceStatus.values.where((s) => s == status).length;
  }
}
