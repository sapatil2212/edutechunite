import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../widgets/app_drawer.dart';

class StudentTimetableScreen extends StatefulWidget {
  const StudentTimetableScreen({super.key});

  @override
  State<StudentTimetableScreen> createState() => _StudentTimetableScreenState();
}

class _StudentTimetableScreenState extends State<StudentTimetableScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _timetableData;
  String _selectedDay = DateFormat('EEEE').format(DateTime.now());
  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  @override
  void initState() {
    super.initState();
    // If today is Sunday, default to Monday
    if (_selectedDay == 'Sunday') {
      _selectedDay = 'Monday';
    }
    _fetchTimetable();
  }

  Future<void> _fetchTimetable() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final data = await apiService.getTimetable();

      setState(() {
        _timetableData = data;
        _isLoading = false;
      });
    } catch (e) {
      print('Error fetching timetable: $e');
      // Mock data for preview
      if (mounted) {
        setState(() {
          _timetableData = {
            'schedule': {
              'Monday': [
                {'subject': 'Mathematics', 'startTime': '08:00', 'endTime': '09:00', 'room': '101', 'teacher': 'Mr. Smith', 'periodNumber': 1},
                {'subject': 'Physics', 'startTime': '09:00', 'endTime': '10:00', 'room': 'Lab 1', 'teacher': 'Mrs. Jones', 'periodNumber': 2},
                {'slotType': 'BREAK', 'startTime': '10:00', 'endTime': '10:30', 'periodNumber': 0},
                {'subject': 'English', 'startTime': '10:30', 'endTime': '11:30', 'room': '102', 'teacher': 'Ms. Brown', 'periodNumber': 3},
              ],
              'Tuesday': [
                {'subject': 'Chemistry', 'startTime': '08:00', 'endTime': '09:00', 'room': 'Lab 2', 'teacher': 'Mr. White', 'periodNumber': 1},
                {'subject': 'Biology', 'startTime': '09:00', 'endTime': '10:00', 'room': 'Lab 3', 'teacher': 'Mrs. Green', 'periodNumber': 2},
                {'slotType': 'BREAK', 'startTime': '10:00', 'endTime': '10:30', 'periodNumber': 0},
                {'subject': 'History', 'startTime': '10:30', 'endTime': '11:30', 'room': '103', 'teacher': 'Mr. Black', 'periodNumber': 3},
              ],
              'Wednesday': [
                 {'subject': 'Mathematics', 'startTime': '08:00', 'endTime': '09:00', 'room': '101', 'teacher': 'Mr. Smith', 'periodNumber': 1},
                 {'subject': 'Computer Science', 'startTime': '09:00', 'endTime': '10:00', 'room': 'Comp Lab', 'teacher': 'Ms. Tech', 'periodNumber': 2},
              ],
              'Thursday': [
                 {'subject': 'Physics', 'startTime': '08:00', 'endTime': '09:00', 'room': 'Lab 1', 'teacher': 'Mrs. Jones', 'periodNumber': 1},
                 {'subject': 'Chemistry', 'startTime': '09:00', 'endTime': '10:00', 'room': 'Lab 2', 'teacher': 'Mr. White', 'periodNumber': 2},
              ],
              'Friday': [
                 {'subject': 'English', 'startTime': '08:00', 'endTime': '09:00', 'room': '102', 'teacher': 'Ms. Brown', 'periodNumber': 1},
                 {'subject': 'PE', 'startTime': '09:00', 'endTime': '10:00', 'room': 'Field', 'teacher': 'Coach', 'periodNumber': 2},
              ]
            }
          };
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      drawer: const AppDrawer(currentRoute: '/timetable'),
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
          'Timetable',
          style: TextStyle(color: Color(0xFF0A0A0A), fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildDaySelector(),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _fetchTimetable,
                    child: _buildTimetableForDay(),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildDaySelector() {
    return Container(
      height: 60,
      color: Colors.white,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        itemCount: _days.length,
        itemBuilder: (context, index) {
          final day = _days[index];
          final isSelected = day == _selectedDay;
          return GestureDetector(
            onTap: () => setState(() => _selectedDay = day),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF3B82F6) : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  day.substring(0, 3),
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey.shade700,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTimetableForDay() {
    final schedule = _timetableData?['schedule'] as Map<String, dynamic>? ?? {};
    final daySchedule = schedule[_selectedDay] as List? ?? [];

    if (daySchedule.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              'No classes on $_selectedDay',
              style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: daySchedule.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final slot = daySchedule[index];
        return _buildTimeSlotCard(slot);
      },
    );
  }

  Widget _buildTimeSlotCard(Map<String, dynamic> slot) {
    final startTime = slot['startTime'] ?? '';
    final endTime = slot['endTime'] ?? '';
    final subject = slot['subject'] ?? '';
    final teacher = slot['teacher'] ?? '';
    final room = slot['room'] ?? '';
    final slotType = slot['slotType'] ?? 'CLASS';
    final isBreak = slotType == 'BREAK';

    return Container(
      padding: const EdgeInsets.all(20),
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
      child: Row(
        children: [
          Container(
            width: 60,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: isBreak ? Colors.orange.shade50 : Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  startTime,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isBreak ? Colors.orange.shade700 : Colors.blue.shade700,
                  ),
                ),
                Text(
                  endTime,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: isBreak
                ? Text(
                    'BREAK',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade700,
                      letterSpacing: 1,
                    ),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subject,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.person_outline, size: 14, color: Colors.grey.shade400),
                          const SizedBox(width: 4),
                          Text(
                            teacher,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade500,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Icon(Icons.room_outlined, size: 14, color: Colors.grey.shade400),
                          const SizedBox(width: 4),
                          Text(
                            room,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
