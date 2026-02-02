import 'package:flutter/material.dart';
import '../../../services/api_service.dart';
import '../../../widgets/common/loading_widget.dart';

class MarksEntryScreen extends StatefulWidget {
  final String? scheduleId;

  const MarksEntryScreen({Key? key, this.scheduleId}) : super(key: key);

  @override
  State<MarksEntryScreen> createState() => _MarksEntryScreenState();
}

class _MarksEntryScreenState extends State<MarksEntryScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  List<dynamic> _schedules = [];
  String? _selectedScheduleId;
  Map<String, dynamic>? _scheduleInfo;
  List<dynamic> _students = [];
  Map<String, TextEditingController> _marksControllers = {};
  Map<String, bool> _absentStatus = {};

  @override
  void initState() {
    super.initState();
    _selectedScheduleId = widget.scheduleId;
    _fetchSchedules();
  }

  @override
  void dispose() {
    _marksControllers.values.forEach((c) => c.dispose());
    super.dispose();
  }

  Future<void> _fetchSchedules() async {
    try {
      final response = await ApiService.get('/teacher/exam-schedules');
      if (response['success'] == true) {
        setState(() {
          _schedules = response['data'] ?? [];
        });
        
        if (_selectedScheduleId != null) {
          _fetchStudents(_selectedScheduleId!);
        } else if (_schedules.isNotEmpty) {
          // Auto-select first pending schedule
          final pending = _schedules.firstWhere(
            (s) => s['marksEntryStatus'] != 'LOCKED' && s['marksEntryStatus'] != 'COMPLETED',
            orElse: () => _schedules.first,
          );
          _selectedScheduleId = pending['id'];
          _fetchStudents(_selectedScheduleId!);
        } else {
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      debugPrint('Error fetching schedules: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchStudents(String scheduleId) async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/teacher/exam-schedules/$scheduleId/students');
      if (response['success'] == true) {
        final data = response['data'];
        setState(() {
          _scheduleInfo = data['scheduleInfo'];
          _students = data['students'] ?? [];
          
          // Initialize controllers and status
          _marksControllers.clear();
          _absentStatus.clear();
          
          for (var student in _students) {
            final id = student['id'];
            final result = student['result'];
            _marksControllers[id] = TextEditingController(
              text: result != null ? '${result['marksObtained']}' : '',
            );
            _absentStatus[id] = result?['isAbsent'] ?? false;
          }
        });
      }
    } catch (e) {
      debugPrint('Error fetching students: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveMarks(bool isDraft) async {
    if (_selectedScheduleId == null) return;

    setState(() => _isSaving = true);
    try {
      final marks = _students.map((student) {
        final id = student['id'];
        final marksText = _marksControllers[id]?.text ?? '0';
        return {
          'studentId': id,
          'marksObtained': double.tryParse(marksText) ?? 0,
          'isAbsent': _absentStatus[id] ?? false,
        };
      }).toList();

      final response = await ApiService.post(
        '/teacher/exam-schedules/$_selectedScheduleId/marks',
        {'marks': marks, 'isDraft': isDraft},
      );

      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isDraft ? 'Marks saved as draft' : 'Marks submitted successfully'),
            backgroundColor: Colors.green,
          ),
        );
        _fetchStudents(_selectedScheduleId!);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response['error'] ?? 'Failed to save marks'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to save marks'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isSaving = false);
    }
  }

  int get _enteredCount => _marksControllers.values.where((c) => c.text.isNotEmpty).length;
  int get _absentCount => _absentStatus.values.where((v) => v).length;
  int get _presentCount => _enteredCount - _absentCount;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Marks Entry'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Schedule Selector
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: DropdownButtonFormField<String>(
              value: _selectedScheduleId,
              decoration: const InputDecoration(
                labelText: 'Select Exam Schedule',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              items: _schedules.map<DropdownMenuItem<String>>((schedule) {
                final exam = schedule['exam'] ?? {};
                final subject = schedule['subject'] ?? {};
                final unit = schedule['academicUnit'] ?? {};
                return DropdownMenuItem(
                  value: schedule['id'],
                  child: Text(
                    '${exam['name']} - ${subject['name']} (${unit['name']})',
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedScheduleId = value);
                  _fetchStudents(value);
                }
              },
            ),
          ),

          if (_selectedScheduleId != null && _scheduleInfo != null) ...[
            // Stats Row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _buildStatChip('Total', '${_students.length}', Colors.blue),
                  const SizedBox(width: 8),
                  _buildStatChip('Entered', '$_enteredCount', Colors.green),
                  const SizedBox(width: 8),
                  _buildStatChip('Absent', '$_absentCount', Colors.red),
                ],
              ),
            ),

            // Info Banner
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Colors.blue, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Max: ${_scheduleInfo!['maxMarks']} • Pass: ${_scheduleInfo!['passingMarks']}',
                      style: const TextStyle(color: Colors.blue, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Student List
          Expanded(
            child: _isLoading
                ? const LoadingWidget()
                : _students.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _students.length,
                        itemBuilder: (context, index) {
                          return _buildStudentCard(_students[index], index);
                        },
                      ),
          ),

          // Action Buttons
          if (_selectedScheduleId != null && _students.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isSaving ? null : () => _saveMarks(true),
                      icon: const Icon(Icons.save_outlined),
                      label: Text(_isSaving ? 'Saving...' : 'Save Draft'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _isSaving || _enteredCount != _students.length
                          ? null
                          : () => _confirmSubmit(),
                      icon: const Icon(Icons.check_circle),
                      label: Text(_isSaving ? 'Submitting...' : 'Submit'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(color: color, fontSize: 12),
          ),
          const SizedBox(width: 4),
          Text(
            value,
            style: TextStyle(color: color, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No students found',
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentCard(Map<String, dynamic> student, int index) {
    final id = student['id'];
    final isAbsent = _absentStatus[id] ?? false;
    final marksText = _marksControllers[id]?.text ?? '';
    final marks = double.tryParse(marksText) ?? 0;
    final maxMarks = _scheduleInfo?['maxMarks'] ?? 100;
    final passingMarks = _scheduleInfo?['passingMarks'] ?? 33;
    final isPassing = !isAbsent && marks >= passingMarks;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isAbsent
              ? Colors.red.withOpacity(0.3)
              : marksText.isNotEmpty
                  ? (isPassing ? Colors.green : Colors.red).withOpacity(0.3)
                  : Colors.grey.withOpacity(0.2),
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
          // Roll Number
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

          // Marks Input
          SizedBox(
            width: 70,
            child: TextField(
              controller: _marksControllers[id],
              enabled: !isAbsent,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                hintText: '0',
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: isAbsent,
                fillColor: isAbsent ? Colors.grey[100] : null,
              ),
              onChanged: (value) {
                final num = double.tryParse(value) ?? 0;
                if (num > maxMarks) {
                  _marksControllers[id]?.text = '$maxMarks';
                }
                setState(() {});
              },
            ),
          ),
          const SizedBox(width: 8),

          // Absent Checkbox
          Column(
            children: [
              Checkbox(
                value: isAbsent,
                onChanged: (value) {
                  setState(() {
                    _absentStatus[id] = value ?? false;
                  });
                },
                activeColor: Colors.red,
              ),
              const Text('Absent', style: TextStyle(fontSize: 10)),
            ],
          ),

          // Status
          Container(
            width: 50,
            alignment: Alignment.center,
            child: isAbsent
                ? const Text(
                    'AB',
                    style: TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  )
                : marksText.isNotEmpty
                    ? Text(
                        isPassing ? 'Pass' : 'Fail',
                        style: TextStyle(
                          color: isPassing ? Colors.green : Colors.red,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      )
                    : const Text(
                        '-',
                        style: TextStyle(color: Colors.grey),
                      ),
          ),
        ],
      ),
    );
  }

  void _confirmSubmit() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Submit Marks'),
        content: const Text(
          'Are you sure you want to submit? This will finalize the marks entry.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _saveMarks(false);
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
