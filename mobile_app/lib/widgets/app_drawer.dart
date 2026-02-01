import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../screens/login_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/student_dashboard.dart';
import '../screens/teacher_dashboard.dart';
import '../screens/student/student_attendance_screen.dart';
import '../screens/student/student_homework_screen.dart';
import '../screens/student/student_timetable_screen.dart';
import '../screens/student/student_exams_screen.dart';
import '../screens/student/student_results_screen.dart';
import '../screens/student/student_notices_screen.dart';

class AppDrawer extends StatelessWidget {
  final String currentRoute;

  const AppDrawer({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final user = authService.user;
    final isTeacher = user?.role == 'TEACHER';

    return Drawer(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(0),
          bottomRight: Radius.circular(0),
        ),
      ),
      child: Column(
        children: [
          _buildDrawerHeader(context, user),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 10),
              children: [
                if (isTeacher) ...[
                  _buildDrawerItem(
                    context,
                    icon: Icons.dashboard_outlined,
                    activeIcon: Icons.dashboard,
                    title: 'Dashboard',
                    isSelected: currentRoute == '/teacher-dashboard',
                    onTap: () => _navigate(context, const TeacherDashboard(initialIndex: 0), '/teacher-dashboard'),
                  ),
                  _buildExpansionTile(
                    context,
                    title: 'My Classes',
                    icon: Icons.school_outlined,
                    activeIcon: Icons.school,
                    children: [
                      _buildDrawerSubItem(
                        context,
                        title: 'All Classes',
                        onTap: () => _navigate(context, const TeacherDashboard(initialIndex: 1), '/teacher-classes'),
                      ),
                      _buildDrawerSubItem(
                        context,
                        title: 'Mark Attendance',
                        onTap: () => _navigate(context, const TeacherDashboard(initialIndex: 1), '/teacher-attendance'), // Points to classes tab for now
                      ),
                    ],
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.bar_chart_outlined,
                    activeIcon: Icons.bar_chart,
                    title: 'Attendance Report',
                    isSelected: currentRoute == '/attendance-report',
                    onTap: () {}, // Placeholder
                  ),
                  _buildExpansionTile(
                    context,
                    title: 'Assignments',
                    icon: Icons.assignment_outlined,
                    activeIcon: Icons.assignment,
                    children: [
                      _buildDrawerSubItem(context, title: 'All Assignments', onTap: () {}),
                      _buildDrawerSubItem(context, title: 'Create Assignment', onTap: () {}),
                    ],
                  ),
                  _buildExpansionTile(
                    context,
                    title: 'Academics',
                    icon: Icons.menu_book_outlined,
                    activeIcon: Icons.menu_book,
                    children: [
                      _buildDrawerSubItem(context, title: 'Subjects', onTap: () {}),
                      _buildDrawerSubItem(context, title: 'Syllabus', onTap: () {}),
                    ],
                  ),
                  _buildExpansionTile(
                    context,
                    title: 'Assessments',
                    icon: Icons.assessment_outlined,
                    activeIcon: Icons.assessment,
                    children: [
                      _buildDrawerSubItem(context, title: 'Exams', onTap: () {}),
                      _buildDrawerSubItem(context, title: 'Results', onTap: () {}),
                    ],
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.calendar_today_outlined,
                    activeIcon: Icons.calendar_today,
                    title: 'My Timetable',
                    isSelected: currentRoute == '/teacher-timetable',
                    onTap: () => _navigate(context, const TeacherDashboard(initialIndex: 2), '/teacher-timetable'),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.notifications_outlined,
                    activeIcon: Icons.notifications,
                    title: 'Notices',
                    isSelected: currentRoute == '/notices',
                    onTap: () {}, // Placeholder
                  ),
                ] else ...[
                  // Student Menu
                  _buildDrawerItem(
                    context,
                    icon: Icons.dashboard_outlined,
                    activeIcon: Icons.dashboard,
                    title: 'Dashboard',
                    isSelected: currentRoute == '/student-dashboard',
                    onTap: () => _navigate(context, const StudentDashboard(), '/student-dashboard'),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.pie_chart_outline,
                    activeIcon: Icons.pie_chart,
                    title: 'Attendance',
                    isSelected: currentRoute == '/attendance',
                    onTap: () => _navigate(context, const StudentAttendanceScreen(), '/attendance'),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.assignment_outlined,
                    activeIcon: Icons.assignment,
                    title: 'Homework',
                    isSelected: currentRoute == '/homework',
                    onTap: () => _navigate(context, const StudentHomeworkScreen(), '/homework'),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.calendar_today_outlined,
                    activeIcon: Icons.calendar_today,
                    title: 'Timetable',
                    isSelected: currentRoute == '/timetable',
                    onTap: () => _navigate(context, const StudentTimetableScreen(), '/timetable'),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.event_note_outlined,
                    activeIcon: Icons.event_note,
                    title: 'Exams',
                    isSelected: currentRoute == '/exams',
                    onTap: () => _navigate(context, const StudentExamsScreen(), '/exams'),
                  ),
                  _buildDrawerItem(
                    context,
                    icon: Icons.notifications_outlined,
                    activeIcon: Icons.notifications,
                    title: 'Notices',
                    isSelected: currentRoute == '/notices',
                    onTap: () => _navigate(context, const StudentNoticesScreen(), '/notices'),
                  ),
                ],
                const Divider(height: 32, thickness: 1),
                _buildDrawerItem(
                  context,
                  icon: Icons.person_outline,
                  activeIcon: Icons.person,
                  title: 'Profile',
                  isSelected: currentRoute == '/profile',
                  onTap: () => isTeacher 
                      ? _navigate(context, const TeacherDashboard(initialIndex: 3), '/profile')
                      : _navigate(context, const ProfileScreen(), '/profile'),
                ),
                _buildDrawerItem(
                  context,
                  icon: Icons.settings_outlined,
                  activeIcon: Icons.settings,
                  title: 'Settings',
                  isSelected: currentRoute == '/settings',
                  onTap: () {
                    // Navigate to settings
                  },
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: InkWell(
              onTap: () async {
                await authService.logout();
                if (context.mounted) {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
                  );
                }
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.logout, color: Color(0xFFEF4444), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Logout',
                      style: TextStyle(
                        color: Color(0xFFEF4444),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerHeader(BuildContext context, dynamic user) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
      color: Colors.white,
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: const Color(0xFF3B82F6),
            child: Text(
              user?.name?.substring(0, 1).toUpperCase() ?? 'U',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.name ?? 'User Name',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  user?.email ?? 'user@example.com',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required IconData activeIcon,
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(
        isSelected ? activeIcon : icon,
        color: isSelected ? const Color(0xFF1F2937) : Colors.grey[500],
        size: 22,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? const Color(0xFF1F2937) : Colors.grey[700],
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          fontSize: 14,
        ),
      ),
      tileColor: isSelected ? const Color(0xFFF3F4F6) : null,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(0),
      ),
      onTap: onTap,
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24),
    );
  }

  Widget _buildExpansionTile(
    BuildContext context, {
    required String title,
    required IconData icon,
    required IconData activeIcon,
    required List<Widget> children,
  }) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        leading: Icon(
          icon,
          color: Colors.grey[500],
          size: 22,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: Colors.grey[700],
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
        childrenPadding: const EdgeInsets.only(left: 16),
        dense: true,
        children: children,
      ),
    );
  }

  Widget _buildDrawerSubItem(
    BuildContext context, {
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      title: Text(
        title,
        style: TextStyle(
          color: Colors.grey[600],
          fontSize: 14,
        ),
      ),
      onTap: onTap,
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 48),
      visualDensity: const VisualDensity(vertical: -4),
    );
  }

  void _navigate(BuildContext context, Widget screen, String routeName) {
    Navigator.pop(context); // Close drawer
    if (currentRoute != routeName) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => screen),
      );
    }
  }
}