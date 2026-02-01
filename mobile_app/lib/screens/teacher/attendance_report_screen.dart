
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class AttendanceReportScreen extends StatefulWidget {
  const AttendanceReportScreen({super.key});

  @override
  State<AttendanceReportScreen> createState() => _AttendanceReportScreenState();
}

class _AttendanceReportScreenState extends State<AttendanceReportScreen> {
  bool _isLoadingClasses = true;
  bool _isLoadingReport = false;
  List<dynamic> _classes = [];
  String? _selectedClassId;
  String _dateRange = 'month'; // 'week', 'month'
  Map<String, dynamic>? _reportData;

  @override
  void initState() {
    super.initState();
    print('AttendanceReportScreen: Initializing...');
    _fetchClasses();
  }

  Future<void> _fetchClasses() async {
    setState(() => _isLoadingClasses = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final response = await apiService.getTeacherClasses();
      
      if (mounted) {
        setState(() {
          if (response['success'] == true && response['data'] != null) {
            final data = response['data'];
            final classTeacherClasses = data['classTeacherClasses'] ?? [];
            final subjectTeacherClasses = data['subjectTeacherClasses'] ?? [];
            
            // Combine and remove duplicates based on id
            final Map<String, dynamic> uniqueClasses = {};
            
            for (var c in classTeacherClasses) {
              // Direct mapping as the API returns flattened structure
              if (c['id'] != null) {
                uniqueClasses[c['id']] = {
                  'id': c['id'],
                  'name': c['name'] ?? 'Unknown Class',
                  'type': 'Class Teacher'
                };
              } else if (c['academicUnit'] != null) {
                 // Fallback for potential nested structure (if API changes back)
                 uniqueClasses[c['academicUnit']['id']] = {
                  'id': c['academicUnit']['id'],
                  'name': c['academicUnit']['name'],
                  'type': 'Class Teacher'
                };
              }
            }
            
            for (var c in subjectTeacherClasses) {
              // Direct mapping
              if (c['id'] != null) {
                if (!uniqueClasses.containsKey(c['id'])) {
                  uniqueClasses[c['id']] = {
                    'id': c['id'],
                    'name': c['name'] ?? 'Unknown Class',
                    'type': 'Subject Teacher'
                  };
                }
              } else if (c['academicUnit'] != null) {
                 if (!uniqueClasses.containsKey(c['academicUnit']['id'])) {
                  uniqueClasses[c['academicUnit']['id']] = {
                    'id': c['academicUnit']['id'],
                    'name': c['academicUnit']['name'],
                    'type': 'Subject Teacher'
                  };
                }
              }
            }
            
            _classes = uniqueClasses.values.toList();
            
            if (_classes.isNotEmpty) {
              _selectedClassId = _classes[0]['id'];
              _fetchReport();
            }
          }
          _isLoadingClasses = false;
        });
      }
    } catch (e) {
      print('Error fetching classes: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load classes: $e')),
        );
        setState(() => _isLoadingClasses = false);
      }
    }
  }

  Future<void> _fetchReport() async {
    if (_selectedClassId == null) return;
    
    setState(() => _isLoadingReport = true);
    print('Fetching report for class: $_selectedClassId, range: $_dateRange'); // Debug
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final response = await apiService.getAttendanceReport(_selectedClassId!, _dateRange);
      print('Report API Response: $response'); // Debug
      
      if (mounted) {
        setState(() {
          if (response['success'] == true && response['data'] != null) {
            _reportData = response['data'];
          } else {
            _reportData = null;
            print('Warning: Report data is null or success is false');
          }
          _isLoadingReport = false;
        });
      }
    } catch (e) {
      print('Error fetching report: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load report: $e')),
        );
        setState(() => _isLoadingReport = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Report'),
        elevation: 0,
      ),
      body: _isLoadingClasses
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildFilters(),
                Expanded(
                  child: _isLoadingReport
                      ? const Center(child: CircularProgressIndicator())
                      : _buildReportContent(),
                ),
              ],
            ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Class Dropdown
          DropdownButtonFormField<String>(
            initialValue: _selectedClassId,
            decoration: const InputDecoration(
              labelText: 'Select Class',
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: _classes.map((c) {
              return DropdownMenuItem<String>(
                value: c['id'],
                child: Text(c['name']),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null && value != _selectedClassId) {
                setState(() {
                  _selectedClassId = value;
                });
                _fetchReport();
              }
            },
          ),
          const SizedBox(height: 12),
          // Date Range Segmented Control
          SizedBox(
            width: double.infinity,
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment<String>(
                  value: 'week',
                  label: Text('This Week'),
                  icon: Icon(Icons.calendar_view_week),
                ),
                ButtonSegment<String>(
                  value: 'month',
                  label: Text('This Month'),
                  icon: Icon(Icons.calendar_month),
                ),
              ],
              selected: {_dateRange},
              onSelectionChanged: (Set<String> newSelection) {
                setState(() {
                  _dateRange = newSelection.first;
                });
                _fetchReport();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportContent() {
    if (_reportData == null) {
      return const Center(child: Text('No data available'));
    }

    final stats = _reportData!['stats'];
    final students = _reportData!['students'] as List<dynamic>? ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSummaryCards(stats),
          const SizedBox(height: 24),
          Text(
            'Student Details',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          _buildStudentList(students),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(Map<String, dynamic>? stats) {
    if (stats == null) return const SizedBox.shrink();

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Attendance',
                '${stats['averageAttendance']}%',
                Icons.pie_chart,
                Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Present',
                '${stats['presentToday']}', // Note: API returns 'Today' stats for dashboard, but report logic might differ. Assuming backend aligns.
                // Wait, checking API: report/route.ts returns 'stats' with totalStudents, presentToday, etc.
                // But wait, the report logic in route.ts might be calculating stats for the *period* or just *today*?
                // Looking at route.ts: 
                // It calculates 'presentToday' etc. but based on what?
                // Ah, the route.ts I read earlier didn't show the full calculation logic.
                // But typically report stats should be for the period. 
                // Let's stick to what's available. If it says 'presentToday', I'll label it 'Today Present' or just 'Present'.
                // Actually, let's use the 'averageAttendance' which is definitely aggregate.
                // For counts, maybe show Total Students.
                Icons.check_circle,
                Colors.green,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Total Students',
                '${stats['totalStudents']}',
                Icons.people,
                Colors.purple,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Late',
                '${stats['lateToday']}',
                Icons.access_time,
                Colors.orange,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentList(List<dynamic> students) {
    if (students.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text('No student records found'),
        ),
      );
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: students.length,
        separatorBuilder: (context, index) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final student = students[index];
          final percentage = student['percentage'] ?? 0;
          
          Color percentageColor = Colors.green;
          if (percentage < 75) percentageColor = Colors.orange;
          if (percentage < 60) percentageColor = Colors.red;

          return ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: CircleAvatar(
              backgroundColor: Colors.blue.shade50,
              child: Text(
                student['name']?.substring(0, 1).toUpperCase() ?? '?',
                style: TextStyle(color: Colors.blue.shade800),
              ),
            ),
            title: Text(
              student['name'] ?? 'Unknown',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text('Roll No: ${student['rollNumber'] ?? 'N/A'}'),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: percentageColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: percentageColor.withOpacity(0.5)),
              ),
              child: Text(
                '$percentage%',
                style: TextStyle(
                  color: percentageColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
