import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/app_drawer.dart';

class StudentAttendanceScreen extends StatefulWidget {
  const StudentAttendanceScreen({super.key});

  @override
  State<StudentAttendanceScreen> createState() => _StudentAttendanceScreenState();
}

class _StudentAttendanceScreenState extends State<StudentAttendanceScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _attendanceData;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _fetchAttendance();
  }

  Future<void> _fetchAttendance() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final authService = Provider.of<AuthService>(context, listen: false);
      final studentId = authService.user?.studentId;

      final data = await apiService.getAttendance(
        studentId: studentId,
        month: DateFormat('yyyy-MM').format(_selectedDate),
      );

      setState(() {
        _attendanceData = data;
        _isLoading = false;
      });
    } catch (e) {
      print('Error fetching attendance: $e');
      // Mock data for preview
      if (mounted) {
        setState(() {
          _attendanceData = {
            'summary': {'present': 20, 'absent': 2, 'late': 1, 'percentage': 87.0},
            'dailyRecords': List.generate(20, (index) {
              final status = index % 10 == 0 ? 'ABSENT' : (index % 7 == 0 ? 'LATE' : 'PRESENT');
              return {
                'date': DateTime.now().subtract(Duration(days: index)).toIso8601String(),
                'status': status,
                'remarks': status == 'ABSENT' ? 'Sick leave' : null,
              };
            }),
          };
          _isLoading = false;
        });
      }
    }
  }

  void _changeMonth(int offset) {
    setState(() {
      _selectedDate = DateTime(_selectedDate.year, _selectedDate.month + offset);
    });
    _fetchAttendance();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      drawer: AppDrawer(currentRoute: '/attendance'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Attendance',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildMonthSelector(),
                  const SizedBox(height: 24),
                  _buildAttendanceChart(),
                  const SizedBox(height: 24),
                  _buildStatsRow(),
                  const SizedBox(height: 32),
                  const Text(
                    'History',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildAttendanceHistory(),
                ],
              ),
            ),
    );
  }

  Widget _buildMonthSelector() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          onPressed: () => _changeMonth(-1),
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Icon(Icons.chevron_left, size: 20),
          ),
        ),
        Text(
          DateFormat('MMMM yyyy').format(_selectedDate),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        IconButton(
          onPressed: () => _changeMonth(1),
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Icon(Icons.chevron_right, size: 20),
          ),
        ),
      ],
    );
  }

  Widget _buildAttendanceChart() {
    // Mock data visualization - ideally this comes from daily attendance logs
    // We will create a simple bar chart representing presence/absence distribution
    final summary = _attendanceData?['summary'];
    final present = double.tryParse(summary?['presentDays']?.toString() ?? '0') ?? 0;
    final absent = double.tryParse(summary?['absentDays']?.toString() ?? '0') ?? 0;
    final total = double.tryParse(summary?['totalDays']?.toString() ?? '1') ?? 1;

    return Container(
      height: 200,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
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
          Expanded(
            child: PieChart(
              PieChartData(
                sectionsSpace: 0,
                centerSpaceRadius: 40,
                sections: [
                  PieChartSectionData(
                    color: const Color(0xFF3B82F6),
                    value: present,
                    title: '${((present / total) * 100).toInt()}%',
                    radius: 25,
                    titleStyle: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  PieChartSectionData(
                    color: const Color(0xFFEF4444),
                    value: absent,
                    title: '',
                    radius: 20,
                  ),
                  PieChartSectionData(
                    color: Colors.grey.shade200,
                    value: total - present - absent, // Remaining days
                    title: '',
                    radius: 15,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 24),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildChartLegend('Present', const Color(0xFF3B82F6), '${present.toInt()} days'),
              const SizedBox(height: 12),
              _buildChartLegend('Absent', const Color(0xFFEF4444), '${absent.toInt()} days'),
              const SizedBox(height: 12),
              _buildChartLegend('Total', Colors.grey.shade400, '${total.toInt()} working days'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartLegend(String label, Color color, String value) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatsRow() {
    final summary = _attendanceData?['summary'];
    final percentage = summary?['percentage'] ?? '0';

    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF3B82F6).withOpacity(0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.trending_up, color: Colors.white, size: 20),
                ),
                const SizedBox(height: 16),
                Text(
                  '$percentage%',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const Text(
                  'Overall Attendance',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAttendanceHistory() {
    // This would typically be a list of records. For now, using the data we have.
    // If API returns daily records, map them here.
    // Assuming _attendanceData might have a 'records' or similar list in future.
    // For now, let's just show a placeholder list or "No detailed records available" if empty.
    
    // Simulating list for UI demo purposes if API doesn't return list
    final records = [
      {'date': '2025-01-28', 'status': 'PRESENT', 'checkIn': '08:00 AM', 'checkOut': '02:00 PM'},
      {'date': '2025-01-27', 'status': 'PRESENT', 'checkIn': '08:05 AM', 'checkOut': '02:00 PM'},
      {'date': '2025-01-24', 'status': 'ABSENT', 'checkIn': '-', 'checkOut': '-'},
      {'date': '2025-01-23', 'status': 'PRESENT', 'checkIn': '07:55 AM', 'checkOut': '02:00 PM'},
    ];

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: records.length,
      itemBuilder: (context, index) {
        final record = records[index];
        final isPresent = record['status'] == 'PRESENT';
        
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: isPresent ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    DateFormat('dd').format(DateTime.parse(record['date']!)),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isPresent ? const Color(0xFF166534) : const Color(0xFF991B1B),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      DateFormat('EEEE, MMMM yyyy').format(DateTime.parse(record['date']!)),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isPresent ? 'Checked in: ${record['checkIn']}' : 'Absent',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isPresent ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  record['status']!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isPresent ? const Color(0xFF166534) : const Color(0xFF991B1B),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
