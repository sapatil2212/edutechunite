import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import 'submission_evaluation_screen.dart';

class AssignmentSubmissionsScreen extends StatefulWidget {
  final String assignmentId;
  final String assignmentTitle;

  const AssignmentSubmissionsScreen({
    Key? key,
    required this.assignmentId,
    required this.assignmentTitle,
  }) : super(key: key);

  @override
  _AssignmentSubmissionsScreenState createState() => _AssignmentSubmissionsScreenState();
}

class _AssignmentSubmissionsScreenState extends State<AssignmentSubmissionsScreen> {
  bool _isLoading = true;
  List<dynamic> _submissions = [];
  String _errorMessage = '';
  String _filterStatus = 'all'; // all, pending, submitted, evaluated

  @override
  void initState() {
    super.initState();
    _fetchSubmissions();
  }

  Future<void> _fetchSubmissions() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final response = await apiService.getAssignmentSubmissions(widget.assignmentId);
      
      if (response['submissions'] != null) {
        setState(() {
          _submissions = response['submissions'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to load submissions';
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

  List<dynamic> get _filteredSubmissions {
    if (_filterStatus == 'all') return _submissions;
    if (_filterStatus == 'pending') {
      return _submissions.where((s) => s['status'] == 'PENDING').toList();
    }
    if (_filterStatus == 'submitted') {
      return _submissions.where((s) => s['status'] == 'SUBMITTED' || s['status'] == 'LATE').toList();
    }
    if (_filterStatus == 'evaluated') {
      return _submissions.where((s) => s['status'] == 'EVALUATED' || s['status'] == 'RETURNED').toList();
    }
    return _submissions;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'SUBMITTED':
        return Colors.blue;
      case 'LATE':
        return Colors.orange;
      case 'EVALUATED':
        return Colors.green;
      case 'RETURNED':
        return Colors.purple;
      case 'PENDING':
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _filterStatus == 'all' 
      ? _submissions 
      : _filterStatus == 'submitted'
        ? _submissions.where((s) => s['status'] == 'SUBMITTED' || s['status'] == 'LATE').toList()
        : _filterStatus == 'evaluated'
          ? _submissions.where((s) => s['status'] == 'EVALUATED' || s['status'] == 'RETURNED').toList()
          : _submissions.where((s) => s['status'] == 'PENDING').toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.assignmentTitle),
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(60),
          child: Container(
            height: 50,
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildFilterChip('All', 'all'),
                SizedBox(width: 8),
                _buildFilterChip('To Review', 'submitted'),
                SizedBox(width: 8),
                _buildFilterChip('Evaluated', 'evaluated'),
                SizedBox(width: 8),
                _buildFilterChip('Pending', 'pending'),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
              ? Center(child: Text(_errorMessage))
              : filteredList.isEmpty
                  ? Center(child: Text('No submissions found'))
                  : ListView.builder(
                      itemCount: filteredList.length,
                      itemBuilder: (context, index) {
                        final submission = filteredList[index];
                        final student = submission['student'];
                        
                        return ListTile(
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: CircleAvatar(
                            backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                            backgroundImage: student['user']?['avatar'] != null 
                              ? NetworkImage(student['user']['avatar']) 
                              : null,
                            child: student['user']?['avatar'] == null
                              ? Text(
                                  student['fullName'][0].toUpperCase(),
                                  style: TextStyle(color: Theme.of(context).primaryColor),
                                )
                              : null,
                          ),
                          title: Text(
                            student['fullName'],
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('ID: ${student['admissionNumber']}'),
                              if (submission['submittedAt'] != null)
                                Text(
                                  'Submitted: ${DateFormat('MMM d, h:mm a').format(DateTime.parse(submission['submittedAt']))}',
                                  style: TextStyle(fontSize: 12),
                                ),
                            ],
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Container(
                                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(submission['status']).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  submission['status'],
                                  style: TextStyle(
                                    color: _getStatusColor(submission['status']),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                              if (submission['evaluation']?['marksObtained'] != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    'Marks: ${submission['evaluation']['marksObtained']}',
                                    style: TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ),
                            ],
                          ),
                          onTap: submission['status'] == 'PENDING' 
                            ? null 
                            : () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => SubmissionEvaluationScreen(
                                      assignmentId: widget.assignmentId,
                                      submission: submission,
                                    ),
                                  ),
                                ).then((_) => _fetchSubmissions());
                              },
                        );
                      },
                    ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filterStatus == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (bool selected) {
        setState(() {
          _filterStatus = value;
        });
      },
      backgroundColor: Colors.grey[200],
      selectedColor: Theme.of(context).primaryColor.withOpacity(0.2),
      labelStyle: TextStyle(
        color: isSelected ? Theme.of(context).primaryColor : Colors.black,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      checkmarkColor: Theme.of(context).primaryColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    );
  }
}
