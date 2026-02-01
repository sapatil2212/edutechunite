import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import '../widgets/app_drawer.dart';
import '../widgets/profile_content.dart';
import 'teacher/mark_attendance_screen.dart';
import 'teacher/attendance_report_screen.dart';

class TeacherDashboard extends StatefulWidget {
  final int initialIndex;

  const TeacherDashboard({super.key, this.initialIndex = 0});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard> with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  bool _isLoading = false;
  Map<String, dynamic>? _teacherData;
  Map<String, dynamic>? _timetableData;
  List<dynamic> _classes = [];
  String _selectedDay = DateFormat('EEEE').format(DateTime.now());
  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );
    _animationController.forward();
    _fetchTeacherData();
    _fetchClasses();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _fetchTeacherData() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final stats = await apiService.getTeacherDashboardStats();
      
      if (mounted) {
        setState(() {
          _teacherData = stats;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error fetching teacher stats: $e');
      // Fallback for demo/offline
      if (mounted) {
        setState(() {
          _teacherData = {
            'totalClasses': 5,
            'totalStudents': 142,
            'attendanceRate': 92,
            'nextClass': {
              'subject': 'Mathematics',
              'class': '10-A',
              'time': '10:30 AM',
              'room': '101'
            },
            'weeklyAttendance': [85, 88, 92, 90, 95, 93, 0],
            'studentStatus': {'present': 28, 'absent': 2, 'late': 1},
            'recentActivities': [
              {'title': 'Grade 10-A Results Published', 'time': '2h ago', 'type': 'result'},
              {'title': 'Meeting with Principal', 'time': '4h ago', 'type': 'meeting'},
              {'title': 'New Syllabus Added', 'time': '1d ago', 'type': 'content'},
            ]
          };
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchClasses() async {
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
          final data = await apiService.getTeacherClasses();
          print('API Response: $data'); // Debug print
          if (mounted) {
            final classTeacherClasses = data['data']['classTeacherClasses'] as List? ?? [];
            final subjectTeacherClasses = data['data']['subjectTeacherClasses'] as List? ?? [];

        final allClasses = [
          ...classTeacherClasses.map((c) => {
            ...c,
            'subject': 'Class Teacher',
            'studentsCount': c['studentCount'],
            'attendance': '-',
            'avgGrade': '-',
          }),
          ...subjectTeacherClasses.map((c) => {
            ...c,
            'subject': (c['subjects'] as List?)?.map((s) => s['name']).join(', ') ?? 'Subject Teacher',
            'studentsCount': c['studentCount'],
            'attendance': '-',
            'avgGrade': '-',
          }),
        ];

        setState(() {
          _classes = allClasses;
        });
      }
    } catch (e) {
      print('Error fetching classes: $e');
      // Fallback for demo
      if (mounted) {
        setState(() {
          _classes = List.generate(5, (index) => {
            'name': 'Class ${10 + index}-A',
            'subject': 'Mathematics',
            'studentsCount': 30 + index,
            'attendance': '${90 + index}%',
            'avgGrade': 'B+'
          });
        });
      }
    }
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
      _animationController.reset();
      _animationController.forward();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = Provider.of<AuthService>(context).user;

    final List<Widget> pages = [
      _buildHomeTab(user?.name ?? 'Teacher'),
      _buildClassesTab(),
      _buildTimetableTab(),
      const ProfileContent(),
    ];

    String currentRoute = '/teacher-dashboard';
    if (_selectedIndex == 1) currentRoute = '/teacher-classes';
    if (_selectedIndex == 2) currentRoute = '/teacher-timetable';
    if (_selectedIndex == 3) currentRoute = '/profile';

    return Scaffold(
      backgroundColor: Colors.white,
      drawer: AppDrawer(currentRoute: currentRoute),
      appBar: _selectedIndex == 0
          ? null
          : AppBar(
              title: Text(['Dashboard', 'My Classes', 'Timetable', 'Profile'][_selectedIndex]),
              backgroundColor: Colors.white,
              surfaceTintColor: Colors.white,
              elevation: 0,
              centerTitle: true,
              titleTextStyle: const TextStyle(
                color: Color(0xFF1F2937),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              iconTheme: const IconThemeData(color: Color(0xFF1F2937)),
            ),
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: pages[_selectedIndex],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _onItemTapped,
        backgroundColor: Colors.white,
        elevation: 0,
        indicatorColor: const Color(0xFFEDF874),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: Color(0xFF1F2937)),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school, color: Color(0xFF1F2937)),
            label: 'Classes',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today, color: Color(0xFF1F2937)),
            label: 'Timetable',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: Color(0xFF1F2937)),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab(String name) {
    final nextClass = _teacherData?['nextClass'] as Map<String, dynamic>?;
    final activities = _teacherData?['recentActivities'] as List<dynamic>? ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(name),
          const SizedBox(height: 24),
          _buildHeroCard(nextClass),
          const SizedBox(height: 24),
          _buildQuickStats(),
          const SizedBox(height: 24),
          _buildChartsSection(),
          const SizedBox(height: 24),
          _buildQuickActions(),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Activity',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              TextButton(
                onPressed: () {},
                child: const Text('See All'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildActivityList(activities),
          const SizedBox(height: 80), // Bottom padding
        ],
      ),
    );
  }

  Widget _buildHeader(String name) {
    return Row(
      children: [
        Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Good Morning,',
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
              Text(
                name,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFEDF874), width: 2),
          ),
          child: CircleAvatar(
            radius: 20,
            backgroundColor: const Color(0xFFEDF874),
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : 'T',
              style: const TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeroCard(Map<String, dynamic>? nextClass) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Next Class',
                  style: TextStyle(color: Color(0xFFEDF874), fontWeight: FontWeight.bold),
                ),
              ),
              const Icon(Icons.more_horiz, color: Colors.white70),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            nextClass?['subject'] ?? 'No Classes',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${nextClass?['class'] ?? '-'} • ${nextClass?['room'] ?? '-'}',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              const Icon(Icons.access_time, color: Color(0xFFEDF874), size: 20),
              const SizedBox(width: 8),
              Text(
                nextClass?['time'] ?? 'Free',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFEDF874),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFEDF874),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Start Class',
                  style: TextStyle(
                    color: Color(0xFF1F2937),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats() {
    return Row(
      children: [
        Expanded(
          child: _buildStatItem(
            'Students',
            '${_teacherData?['totalStudents'] ?? 0}',
            Icons.people_outline,
            const Color(0xFFEDF874),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildStatItem(
            'Attendance',
            '${_teacherData?['attendanceRate'] ?? 0}%',
            Icons.pie_chart_outline,
            const Color(0xFFEDF874),
          ),
        ),
      ],
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF1F2937),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 20,
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
              const Text(
                'Weekly Attendance',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              Icon(Icons.bar_chart, color: Colors.grey[400]),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 150,
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: 6,
                minY: 0,
                maxY: 100,
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      const FlSpot(0, 85),
                      const FlSpot(1, 88),
                      const FlSpot(2, 92),
                      const FlSpot(3, 90),
                      const FlSpot(4, 95),
                      const FlSpot(5, 93),
                      const FlSpot(6, 88),
                    ],
                    isCurved: true,
                    color: const Color(0xFF1F2937),
                    barWidth: 4,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFF1F2937).withOpacity(0.05),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Avg. 92%', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('+2.5% vs last week', style: TextStyle(color: Colors.green[600], fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActivityList(List<dynamic> activities) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: activities.length,
      itemBuilder: (context, index) {
        final activity = activities[index];
        IconData icon;
        Color color;
        
        switch(activity['type']) {
          case 'result': icon = Icons.assignment_turned_in; color = Colors.orange; break;
          case 'meeting': icon = Icons.people; color = Colors.purple; break;
          default: icon = Icons.article; color = const Color(0xFF1F2937);
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity['title'] ?? '',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      activity['time'] ?? '',
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
        );
      },
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                title: 'Attendance Report',
                icon: Icons.bar_chart,
                color: Colors.blue,
                onTap: () {
                  print('Attempting to navigate to AttendanceReportScreen');
                  try {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AttendanceReportScreen(),
                      ),
                    ).then((_) => print('Returned from AttendanceReportScreen'));
                  } catch (e) {
                    print('Navigation Error: $e');
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e')),
                    );
                  }
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                title: 'Assignments',
                icon: Icons.assignment,
                color: Colors.purple,
                onTap: () {
                  // TODO: Implement assignments
                },
              ),
            ),
          ],
        ),
        // Debug Button
        Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const AttendanceReportScreen(),
                ),
              );
            },
            child: const Text('DEBUG: Open Report'),
          ),
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: () {
            print('Action Card Tapped: $title');
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Opening $title...'), duration: const Duration(seconds: 1)),
            );
            onTap();
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: color),
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildClassesTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFEDF874)));
    }

    if (_classes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.class_outlined, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'No classes assigned',
              style: TextStyle(color: Colors.grey[500], fontSize: 16),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _fetchClasses,
              child: const Text('Refresh'),
            ),
            if (Provider.of<AuthService>(context, listen: false).user?.role != 'TEACHER')
              const Padding(
                padding: EdgeInsets.all(8.0),
                child: Text('Warning: Not logged in as Teacher', style: TextStyle(color: Colors.red)),
              ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _classes.length,
      itemBuilder: (context, index) {
        final classData = _classes[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 15,
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1F2937).withOpacity(0.05),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      classData['name'] ?? 'Class Name',
                      style: const TextStyle(
                        color: Color(0xFF1F2937),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const Icon(Icons.more_horiz, color: Colors.grey),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                classData['subject'] ?? 'Subject',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${classData['studentsCount'] ?? 0} Students',
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildClassStat('Attendance', '${classData['attendance'] ?? 0}%'),
                  ),
                  Expanded(
                    child: _buildClassStat('Avg. Grade', classData['avgGrade'] ?? '-'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => MarkAttendanceScreen(
                          classId: classData['id'] ?? '',
                          className: classData['name'] ?? '',
                          subjectName: classData['subject'] ?? '',
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.check_circle_outline, size: 18),
                  label: const Text('Take Attendance'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEDF874),
                    foregroundColor: const Color(0xFF1F2937),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildClassStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
      ],
    );
  }

  Widget _buildTimetableTab() {
    return Column(
      children: [
        Container(
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
        ),
        Expanded(
          child: _buildTimetableList(),
        ),
      ],
    );
  }

  Widget _buildTimetableList() {
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
    final periodNumber = slot['periodNumber'];
    final startTime = slot['startTime'] ?? '';
    final endTime = slot['endTime'] ?? '';
    final subject = slot['subject'];
    final academicUnit = slot['academicUnit']; // Class name for teachers
    final slotType = slot['slotType'] ?? 'CLASS';
    final isBreak = slotType == 'BREAK';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            padding: const EdgeInsets.all(8),
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
                    color: isBreak ? Colors.orange : Colors.blue,
                  ),
                ),
                Text(
                  endTime,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey.shade600,
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
                  isBreak ? 'Break Time' : (subject?['name'] ?? 'Free Period'),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Color(0xFF1F2937),
                  ),
                ),
                if (academicUnit != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    academicUnit['name'] ?? '',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isBreak ? Colors.orange.shade50 : Colors.blue.shade50,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              isBreak ? 'BREAK' : 'P$periodNumber',
              style: TextStyle(
                color: isBreak ? Colors.orange : Colors.blue,
                fontWeight: FontWeight.bold,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileTab(dynamic user) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 50,
            backgroundColor: const Color(0xFF3B82F6),
            child: Text(
              user?.name?.isNotEmpty == true ? user.name[0].toUpperCase() : 'T',
              style: const TextStyle(fontSize: 40, color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            user?.name ?? 'Teacher Name',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          Text(
            user?.email ?? 'teacher@example.com',
            style: const TextStyle(fontSize: 16, color: Colors.grey),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () {
              Provider.of<AuthService>(context, listen: false).logout();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            },
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}
