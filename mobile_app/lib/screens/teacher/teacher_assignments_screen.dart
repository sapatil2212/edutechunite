import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import 'create_assignment_screen.dart';
import 'assignment_submissions_screen.dart';

class TeacherAssignmentsScreen extends StatefulWidget {
  const TeacherAssignmentsScreen({super.key});

  @override
  _TeacherAssignmentsScreenState createState() => _TeacherAssignmentsScreenState();
}

class _TeacherAssignmentsScreenState extends State<TeacherAssignmentsScreen> {
  bool _isLoading = true;
  List<dynamic> _assignments = [];
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchAssignments();
  }

  Future<void> _fetchAssignments() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final response = await apiService.getAssignments();
      
      if (response['assignments'] != null) {
        setState(() {
          _assignments = response['assignments'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to load assignments';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteAssignment(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete Assignment'),
        content: Text('Are you sure you want to delete this assignment? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);
      try {
        final apiService = Provider.of<ApiService>(context, listen: false);
        await apiService.deleteAssignment(id);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Assignment deleted successfully')),
        );
        _fetchAssignments();
      } catch (e) {
        setState(() {
          _isLoading = false;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        });
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PUBLISHED':
        return Colors.green;
      case 'DRAFT':
        return Colors.grey;
      case 'CLOSED':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Assignments'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _fetchAssignments,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => CreateAssignmentScreen()),
          );
          if (result == true) {
            _fetchAssignments();
          }
        },
        child: Icon(Icons.add),
        backgroundColor: Theme.of(context).primaryColor,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
              ? Center(child: Text(_errorMessage))
              : _assignments.isEmpty
                  ? Center(child: Text('No assignments found'))
                  : ListView.builder(
                      itemCount: _assignments.length,
                      padding: EdgeInsets.all(16),
                      itemBuilder: (context, index) {
                        final assignment = _assignments[index];
                        final stats = assignment['stats'] ?? {};
                        final submitted = stats['submitted'] ?? 0;
                        final total = stats['totalStudents'] ?? 0;
                        final evaluated = stats['evaluated'] ?? 0;
                        
                        return Card(
                          margin: EdgeInsets.only(bottom: 16),
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => AssignmentSubmissionsScreen(
                                    assignmentId: assignment['id'],
                                    assignmentTitle: assignment['title'],
                                  ),
                                ),
                              ).then((_) => _fetchAssignments());
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: _getStatusColor(assignment['status']).withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          assignment['status'],
                                          style: TextStyle(
                                            color: _getStatusColor(assignment['status']),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      Row(
                                        children: [
                                          if (assignment['dueDate'] != null) ...[
                                            Icon(Icons.access_time, size: 14, color: Colors.grey),
                                            SizedBox(width: 4),
                                            Text(
                                              DateFormat('MMM d, y').format(DateTime.parse(assignment['dueDate'])),
                                              style: TextStyle(color: Colors.grey, fontSize: 12),
                                            ),
                                            SizedBox(width: 8),
                                          ],
                                          PopupMenuButton<String>(
                                            icon: Icon(Icons.more_vert, color: Colors.grey),
                                            onSelected: (value) async {
                                              if (value == 'edit') {
                                                final result = await Navigator.push(
                                                  context,
                                                  MaterialPageRoute(
                                                    builder: (context) => CreateAssignmentScreen(
                                                      assignment: assignment,
                                                    ),
                                                  ),
                                                );
                                                if (result == true) {
                                                  _fetchAssignments();
                                                }
                                              } else if (value == 'delete') {
                                                _deleteAssignment(assignment['id']);
                                              }
                                            },
                                            itemBuilder: (BuildContext context) => [
                                              PopupMenuItem(
                                                value: 'edit',
                                                child: Row(
                                                  children: [
                                                    Icon(Icons.edit, size: 20),
                                                    SizedBox(width: 8),
                                                    Text('Edit'),
                                                  ],
                                                ),
                                              ),
                                              PopupMenuItem(
                                                value: 'delete',
                                                child: Row(
                                                  children: [
                                                    Icon(Icons.delete, size: 20, color: Colors.red),
                                                    SizedBox(width: 8),
                                                    Text('Delete', style: TextStyle(color: Colors.red)),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 12),
                                  Text(
                                    assignment['title'],
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    '${assignment['subject']?['name'] ?? 'No Subject'} • ${assignment['academicUnit']?['name'] ?? 'No Class'}',
                                    style: TextStyle(color: Colors.grey[600], fontSize: 14),
                                  ),
                                  SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildStatItem(
                                          'Submitted',
                                          '$submitted/$total',
                                          Colors.blue,
                                        ),
                                      ),
                                      Expanded(
                                        child: _buildStatItem(
                                          'Evaluated',
                                          '$evaluated',
                                          Colors.green,
                                        ),
                                      ),
                                      Expanded(
                                        child: _buildStatItem(
                                          'Pending',
                                          '${submitted - evaluated}',
                                          Colors.orange,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
          ),
        ),
        SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ],
    );
  }
}
