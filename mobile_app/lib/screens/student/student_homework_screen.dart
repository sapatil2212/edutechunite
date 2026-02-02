import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../widgets/app_drawer.dart';
import 'student_assignment_detail_screen.dart';

class StudentHomeworkScreen extends StatefulWidget {
  const StudentHomeworkScreen({super.key});

  @override
  State<StudentHomeworkScreen> createState() => _StudentHomeworkScreenState();
}

class _StudentHomeworkScreenState extends State<StudentHomeworkScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<dynamic> _allHomework = [];
  List<dynamic> _pendingHomework = [];
  List<dynamic> _completedHomework = [];
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchHomework();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchHomework() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final data = await apiService.getAssignments();

      final homeworks = (data['assignments'] as List? ?? []);
      setState(() {
        _allHomework = homeworks;
        _pendingHomework = homeworks.where((h) {
          final submission = h['submission'];
          return submission == null || submission['status'] == 'PENDING';
        }).toList();
        _completedHomework = homeworks.where((h) {
          final submission = h['submission'];
          return submission != null && ['SUBMITTED', 'LATE_SUBMITTED', 'LATE', 'EVALUATED'].contains(submission['status']);
        }).toList();
        _isLoading = false;
      });
    } catch (e) {
      print('Error fetching assignments: $e');
      // Mock data for preview
      if (mounted) {
        setState(() {
          _allHomework = [
            {'subject': {'name': 'Mathematics'}, 'title': 'Algebra Chapter 5', 'dueDate': '2025-10-25', 'submission': null},
            {'subject': {'name': 'Physics'}, 'title': 'Newton Laws', 'dueDate': '2025-10-26', 'submission': {'status': 'PENDING'}},
            {'subject': {'name': 'History'}, 'title': 'World War II Essay', 'dueDate': '2025-10-20', 'submission': {'status': 'SUBMITTED', 'score': 'A'}},
            {'subject': {'name': 'English'}, 'title': 'Poetry Analysis', 'dueDate': '2025-10-22', 'submission': {'status': 'SUBMITTED', 'score': 'B+'}},
            {'subject': {'name': 'Chemistry'}, 'title': 'Periodic Table', 'dueDate': '2025-10-28', 'submission': null},
          ];
          _pendingHomework = _allHomework.where((h) => h['submission'] == null || h['submission']['status'] == 'PENDING').toList();
          _completedHomework = _allHomework.where((h) => h['submission'] != null && h['submission']['status'] == 'SUBMITTED').toList();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      drawer: const AppDrawer(currentRoute: '/homework'),
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
          'Homework',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF3B82F6),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFF3B82F6),
          indicatorSize: TabBarIndicatorSize.label,
          dividerColor: Colors.transparent,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Pending'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchHomework,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildHomeworkList(_allHomework),
                  _buildHomeworkList(_pendingHomework),
                  _buildHomeworkList(_completedHomework),
                ],
              ),
            ),
    );
  }

  Widget _buildHomeworkList(List<dynamic> homeworks) {
    if (homeworks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_outlined, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'No homework found',
              style: TextStyle(color: Colors.grey[500], fontSize: 16),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: homeworks.length,
      itemBuilder: (context, index) {
        final homework = homeworks[index];
        final subject = homework['subject']?['name'] ?? 'Subject';
        final title = homework['title'] ?? 'Homework';
        final dueDateStr = homework['dueDate'] ?? '';
        final dueDate = DateTime.tryParse(dueDateStr);
        final submission = homework['submission'];
        final isSubmitted = submission != null && submission['status'] == 'SUBMITTED';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
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
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => StudentAssignmentDetailScreen(
                      assignmentId: homework['id'],
                    ),
                  ),
                ).then((_) => _fetchHomework()); // Refresh on return
              },
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            subject,
                            style: const TextStyle(
                              color: Color(0xFF3B82F6),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: isSubmitted ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            isSubmitted ? 'Submitted' : 'Pending',
                            style: TextStyle(
                              color: isSubmitted ? const Color(0xFF166534) : const Color(0xFF92400E),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Text(
                          dueDate != null ? 'Due ${DateFormat('MMM dd, yyyy').format(dueDate)}' : 'No due date',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
