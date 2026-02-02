import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../widgets/modern_stat_card.dart';
import '../widgets/app_drawer.dart';
import 'login_screen.dart';
import 'student/student_attendance_screen.dart';
import 'student/student_homework_screen.dart';
import 'student/student_timetable_screen.dart';
import 'student/student_exams_screen.dart';
import 'student/student_notices_screen.dart';

class StudentDashboard extends StatefulWidget {
  const StudentDashboard({super.key});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  Map<String, dynamic>? _dashboardData;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    
    _fetchDashboardData();
  }

  Widget _buildSubjectsSection() {
    final subjects = _dashboardData?['subjects'] as List? ?? [];
    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'My Subjects',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 16),
          if (subjects.isEmpty)
            Text(
              'No subjects assigned',
              style: TextStyle(color: Colors.grey[600]),
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: subjects.map((s) {
                final name = s['name'] ?? s['subject']?['name'] ?? 'Subject';
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    name,
                    style: const TextStyle(
                      color: Color(0xFF1F2937),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }
 
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _fetchDashboardData() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final authService = Provider.of<AuthService>(context, listen: false);
      final studentId = authService.user?.studentId;

      final profile = await apiService.getProfile();
      final academicUnitId = profile['academicUnit']?['id'] ?? profile['classId'];

      final results = await Future.wait([
        apiService.getAttendance(studentId: studentId),
        apiService.getHomework(upcoming: true),
        apiService.getExams(upcoming: true),
        apiService.getTimetable(),
        apiService.getSubjects(academicUnitId: academicUnitId),
      ]);

      if (mounted) {
        setState(() {
          _dashboardData = {
            'attendance': results[0]['summary'],
            'homework': results[1]['homeworks'],
            'exams': results[2]['exams'],
            'timetable': results[3]['todaySchedule'],
            'subjects': results[4]['data'] ?? [],
          };
          _isLoading = false;
        });
        _animationController.forward();
      }
    } catch (e) {
      print('Error loading dashboard: $e');
      // Mock data for preview
      if (mounted) {
        setState(() {
          _dashboardData = {
            'attendance': {'present': 45, 'total': 50, 'percentage': 90.0},
            'homework': [
              {'subject': 'Math', 'title': 'Algebra Exercises', 'dueDate': '2025-10-25', 'status': 'PENDING'},
              {'subject': 'Physics', 'title': 'Lab Report', 'dueDate': '2025-10-26', 'status': 'PENDING'},
            ],
            'exams': [
              {'subject': 'Chemistry', 'title': 'Mid-Term', 'date': '2025-11-05', 'time': '09:00 AM'},
            ],
            'timetable': [
              {'subject': 'Mathematics', 'time': '08:00 - 09:00', 'room': '101'},
              {'subject': 'Physics', 'time': '09:00 - 10:00', 'room': 'Lab 1'},
              {'subject': 'English', 'time': '10:30 - 11:30', 'room': '102'},
            ],
            'subjects': [
              {'name': 'Mathematics'},
              {'name': 'English'},
              {'name': 'Science'},
              {'name': 'EVS'},
              {'name': 'Hindi'},
            ],
          };
          _isLoading = false;
        });
        _animationController.forward();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthService>(context).user;
    final userName = user?.name ?? 'Student';

    return Scaffold(
      backgroundColor: Colors.white,
      drawer: const AppDrawer(currentRoute: '/student-dashboard'),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchDashboardData,
              child: CustomScrollView(
                slivers: [
                  SliverAppBar(
                    expandedHeight: 120.0,
                    floating: false,
                    pinned: true,
                    backgroundColor: Colors.white,
                    surfaceTintColor: Colors.white,
                    elevation: 0,
                    flexibleSpace: FlexibleSpaceBar(
                      titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
                      title: Text(
                        'Hi, $userName',
                        style: const TextStyle(
                          color: Color(0xFF1F2937),
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                        ),
                      ),
                    ),
                    actions: [
                      IconButton(
                        icon: const Icon(Icons.notifications_outlined, color: Color(0xFF1F2937)),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const StudentNoticesScreen()),
                          );
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.logout, color: Color(0xFFEF4444)),
                        onPressed: () {
                          Provider.of<AuthService>(context, listen: false).logout();
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(builder: (context) => const LoginScreen()),
                          );
                        },
                      ),
                    ],
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.all(20),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        FadeTransition(
                          opacity: _fadeAnimation,
                          child: SlideTransition(
                            position: _slideAnimation,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Overview',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1F2937),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                _buildStatsGrid(context),
                                const SizedBox(height: 32),
                                _buildSubjectsSection(),
                                const SizedBox(height: 32),
                                _buildScheduleSection(),
                                const SizedBox(height: 32),
                                _buildPerformanceSection(),
                              ],
                            ),
                          ),
                        ),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatsGrid(BuildContext context) {
    final attendance = _dashboardData?['attendance'];
    final homeworks = _dashboardData?['homework'] as List? ?? [];
    final exams = _dashboardData?['exams'] as List? ?? [];

    final attendancePct = attendance?['percentage'] ?? '0';
    final pendingHomework = homeworks.where((h) {
      final sub = h['submission'];
      return sub == null || sub['status'] == 'PENDING';
    }).length;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentAttendanceScreen())),
                child: ModernStatCard(
                  title: 'Attendance',
                  value: '$attendancePct%',
                  icon: Icons.pie_chart,
                  backgroundColor: const Color(0xFF3B82F6),
                  textColor: Colors.white,
                  iconColor: Colors.white,
                  subtitle: '+2% from last month', // Mock trend
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentHomeworkScreen())),
                child: ModernStatCard(
                  title: 'Homework',
                  value: '$pendingHomework',
                  icon: Icons.assignment_outlined,
                  isDark: true,
                  subtitle: 'Pending tasks',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentExamsScreen())),
                child: ModernStatCard(
                  title: 'Exams',
                  value: '${exams.length}',
                  icon: Icons.event_note,
                  isDark: true,
                  subtitle: 'Upcoming',
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentTimetableScreen())),
                child: const ModernStatCard(
                  title: 'Timetable',
                  value: 'View',
                  icon: Icons.calendar_today,
                  backgroundColor: Color(0xFF3B82F6),
                  textColor: Colors.white,
                  iconColor: Colors.white,
                  subtitle: 'Today\'s Schedule',
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildScheduleSection() {
    final timetable = _dashboardData?['timetable'] as List? ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Today\'s Schedule',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 16),
        if (timetable.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Text('No classes scheduled for today'),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: timetable.length,
            itemBuilder: (context, index) {
              final session = timetable[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
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
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.class_outlined, color: Color(0xFF3B82F6)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            session['subject']?['name'] ?? 'Subject',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${session['startTime']} - ${session['endTime']}',
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'Room ${session['classroom'] ?? 'N/A'}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          color: Color(0xFF4B5563),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildPerformanceSection() {
    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Performance',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'This Term',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF4B5563),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Placeholder for performance chart
          SizedBox(
            height: 150,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(6, (index) {
                final height = 40.0 + (index * 15.0) + (index % 2 * 30.0);
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      width: 30,
                      height: height,
                      decoration: BoxDecoration(
                        color: index == 4 ? const Color(0xFF3B82F6) : const Color(0xFFE5E7EB),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index],
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}
