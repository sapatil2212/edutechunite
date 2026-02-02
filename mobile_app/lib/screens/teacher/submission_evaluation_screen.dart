import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';

class SubmissionEvaluationScreen extends StatefulWidget {
  final String assignmentId;
  final Map<String, dynamic> submission;

  const SubmissionEvaluationScreen({
    Key? key,
    required this.assignmentId,
    required this.submission,
  }) : super(key: key);

  @override
  _SubmissionEvaluationScreenState createState() => _SubmissionEvaluationScreenState();
}

class _SubmissionEvaluationScreenState extends State<SubmissionEvaluationScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _marksController;
  late TextEditingController _feedbackController;
  String _status = 'EVALUATED';
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final evaluation = widget.submission['evaluation'];
    _marksController = TextEditingController(text: evaluation?['marksObtained']?.toString() ?? '');
    _feedbackController = TextEditingController(text: evaluation?['feedback'] ?? '');
    if (evaluation?['status'] != null) {
      _status = evaluation['status'];
    }
  }

  @override
  void dispose() {
    _marksController.dispose();
    _feedbackController.dispose();
    super.dispose();
  }

  Future<void> _submitEvaluation() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      final data = {
        'submissionId': widget.submission['id'],
        'marksObtained': _marksController.text.isNotEmpty ? double.parse(_marksController.text) : null,
        'feedback': _feedbackController.text,
        'status': _status,
      };

      await apiService.evaluateSubmission(widget.assignmentId, data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Evaluation saved successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _openAttachment(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open file')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final student = widget.submission['student'];
    final attachments = widget.submission['attachments'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text('Evaluate Submission'),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Student Info Card
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundImage: student['user']?['avatar'] != null 
                        ? NetworkImage(student['user']['avatar']) 
                        : null,
                      child: student['user']?['avatar'] == null
                        ? Text(student['fullName'][0].toUpperCase())
                        : null,
                    ),
                    SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          student['fullName'],
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'ID: ${student['admissionNumber']}',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 24),

            // Attachments
            Text(
              'Attachments',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            if (attachments.isEmpty)
              Text('No attachments submitted', style: TextStyle(color: Colors.grey)),
            ...attachments.map((file) => Card(
              margin: EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Icon(Icons.attachment, color: Theme.of(context).primaryColor),
                title: Text(file['fileName'] ?? file['name'] ?? 'Attachment'),
                subtitle: Text(file['mimeType']?.toUpperCase() ?? file['type']?.toUpperCase() ?? 'FILE'),
                trailing: Icon(Icons.open_in_new),
                onTap: () => _openAttachment(file['url']),
              ),
            )).toList(),
            
            SizedBox(height: 24),
            Divider(),
            SizedBox(height: 16),

            // Evaluation Form
            Text(
              'Evaluation',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _marksController,
                    decoration: InputDecoration(
                      labelText: 'Marks Obtained',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      prefixIcon: Icon(Icons.grade),
                    ),
                    keyboardType: TextInputType.numberWithOptions(decimal: true),
                    validator: (value) {
                      if (value != null && value.isNotEmpty) {
                        if (double.tryParse(value) == null) {
                          return 'Please enter a valid number';
                        }
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  
                  DropdownButtonFormField<String>(
                    value: _status,
                    decoration: InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      prefixIcon: Icon(Icons.flag),
                    ),
                    items: [
                      DropdownMenuItem(value: 'EVALUATED', child: Text('Evaluated')),
                      DropdownMenuItem(value: 'RETURNED', child: Text('Return for Revision')),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _status = value;
                        });
                      }
                    },
                  ),
                  SizedBox(height: 16),

                  TextFormField(
                    controller: _feedbackController,
                    decoration: InputDecoration(
                      labelText: 'Feedback',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      prefixIcon: Icon(Icons.comment),
                      alignLabelWithHint: true,
                    ),
                    maxLines: 4,
                  ),
                  SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitEvaluation,
                      style: ElevatedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isSubmitting
                        ? CircularProgressIndicator(color: Colors.white)
                        : Text('Save Evaluation', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
