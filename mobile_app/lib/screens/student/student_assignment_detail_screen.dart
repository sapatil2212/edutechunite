import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';

class StudentAssignmentDetailScreen extends StatefulWidget {
  final String assignmentId;

  const StudentAssignmentDetailScreen({
    super.key,
    required this.assignmentId,
  });

  @override
  State<StudentAssignmentDetailScreen> createState() => _StudentAssignmentDetailScreenState();
}

class _StudentAssignmentDetailScreenState extends State<StudentAssignmentDetailScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  Map<String, dynamic>? _assignment;
  Map<String, dynamic>? _submission;
  
  // Submission Form
  final _remarksController = TextEditingController();
  List<Map<String, dynamic>> _uploadedFiles = [];
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    _fetchAssignmentDetails();
  }

  Future<void> _fetchAssignmentDetails() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final res = await apiService.getAssignmentDetails(widget.assignmentId);
      
      // Handle both response formats: { assignment: {...} } and { success: true, data: {...} }
      Map<String, dynamic>? data;
      if (res['assignment'] != null) {
        data = res['assignment'];
      } else if (res['success'] == true && res['data'] != null) {
        data = res['data'];
      }
      
      if (data != null) {
        setState(() {
          _assignment = data;
          _submission = data!['studentSubmission'];
          if (_submission != null && _submission!['remarks'] != null) {
            _remarksController.text = _submission!['remarks'];
          }
        });
      }
    } catch (e) {
      _showError('Failed to load assignment: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickAndUploadFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'png', 'zip', 'txt'],
      );

      if (result != null) {
        setState(() => _isUploading = true);
        final file = File(result.files.single.path!);
        final apiService = Provider.of<ApiService>(context, listen: false);
        
        final res = await apiService.uploadFile(file.path, 'submissions');
        
        if (res['success'] == true) {
          setState(() {
            _uploadedFiles.add({
              'url': res['url'],
              'fileName': result.files.single.name,
              'fileSize': result.files.single.size,
              'mimeType': result.files.single.extension,
            });
          });
        } else {
          _showError('Upload failed: ${res['error']}');
        }
      }
    } catch (e) {
      _showError('Error uploading file: $e');
    } finally {
      setState(() => _isUploading = false);
    }
  }

  Future<void> _submitAssignment() async {
    if (_assignment == null) return;
    
    // Validation
    final mode = _assignment!['submissionMode'];
    if (mode != 'OFFLINE' && _uploadedFiles.isEmpty && _submission == null) {
      _showError('Please upload at least one file');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      final payload = {
        'remarks': _remarksController.text,
        'attachments': _uploadedFiles,
      };

      await apiService.submitAssignment(widget.assignmentId, payload);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Assignment submitted successfully')),
        );
        _fetchAssignmentDetails(); // Refresh to show submission status
        // Clear form
        setState(() {
          _uploadedFiles = [];
          _remarksController.clear();
        });
      }
    } catch (e) {
      _showError('Failed to submit: $e');
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      _showError('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Assignment Details'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _assignment == null
              ? const Center(child: Text('Assignment not found'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header Section
                      _buildHeader(),
                      const SizedBox(height: 20),
                      
                      // Instructions
                      if (_assignment!['instructions'] != null && _assignment!['instructions'].isNotEmpty) ...[
                        const Text(
                          'Instructions',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _assignment!['instructions'],
                          style: const TextStyle(color: Colors.black87),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Attachments provided by teacher
                      if (_assignment!['attachments'] != null && (_assignment!['attachments'] as List).isNotEmpty) ...[
                        const Text(
                          'Attachments',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 8),
                        ...(_assignment!['attachments'] as List).map((file) => _buildAttachmentItem(file)),
                        const SizedBox(height: 20),
                      ],

                      const Divider(),
                      const SizedBox(height: 20),

                      // Submission Section
                      _buildSubmissionSection(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildHeader() {
    final subject = _assignment!['subject']?['name'] ?? 'Subject';
    final title = _assignment!['title'] ?? 'Untitled';
    final dueDate = _assignment!['dueDate'] != null 
        ? DateFormat('MMM d, y h:mm a').format(DateTime.parse(_assignment!['dueDate']))
        : 'No due date';
    final maxMarks = _assignment!['maxMarks'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
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
        const SizedBox(height: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
            const SizedBox(width: 4),
            Text(
              'Due: $dueDate',
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            if (maxMarks != null) ...[
              const SizedBox(width: 16),
              Icon(Icons.grade, size: 16, color: Colors.grey[600]),
              const SizedBox(width: 4),
              Text(
                '$maxMarks Marks',
                style: TextStyle(color: Colors.grey[600], fontSize: 14),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildAttachmentItem(Map<String, dynamic> file) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      color: Colors.grey[50],
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: ListTile(
        leading: const Icon(Icons.attach_file, color: Color(0xFF3B82F6)),
        title: Text(
          file['fileName'] ?? 'Unknown file',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 14),
        ),
        trailing: const Icon(Icons.download_rounded, size: 20),
        onTap: () => _launchUrl(file['url']),
      ),
    );
  }

  Widget _buildSubmissionSection() {
    final status = _submission?['status'] ?? 'PENDING';
    final isSubmitted = ['SUBMITTED', 'LATE_SUBMITTED', 'LATE', 'EVALUATED'].contains(status);
    final evaluation = _submission?['evaluation'];
    final score = evaluation?['marksObtained'];
    final feedback = evaluation?['feedback'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Your Work',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isSubmitted ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                status,
                style: TextStyle(
                  color: isSubmitted ? const Color(0xFF166534) : const Color(0xFF92400E),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        if (score != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFBBF7D0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Grade', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('$score / ${_assignment!['maxMarks'] ?? '-'}'),
                if (feedback != null) ...[
                  const SizedBox(height: 8),
                  const Text('Feedback', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(feedback),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Show submitted files if any
        if (_submission?['attachments'] != null) ...[
          const Text('Submitted Files:', style: TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          ...(_submission!['attachments'] as List).map((file) => _buildAttachmentItem(file)),
          const SizedBox(height: 16),
        ],

        // Submission Form (Only if not submitted or resubmission allowed - simplistic check for now)
        if (!isSubmitted || _assignment!['allowResubmission'] == true) ...[
          const Text('Add Submission', style: TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(height: 12),
          
          // Remarks
          TextField(
            controller: _remarksController,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Add remarks or comments...',
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.all(12),
            ),
          ),
          const SizedBox(height: 16),

          // Uploaded Files List
          if (_uploadedFiles.isNotEmpty) ...[
            ..._uploadedFiles.map((file) => ListTile(
              leading: const Icon(Icons.file_present),
              title: Text(file['fileName']),
              trailing: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  setState(() {
                    _uploadedFiles.remove(file);
                  });
                },
              ),
            )),
            const SizedBox(height: 8),
          ],

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isUploading ? null : _pickAndUploadFile,
                  icon: _isUploading 
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.upload_file),
                  label: Text(_isUploading ? 'Uploading...' : 'Add File'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting || (_uploadedFiles.isEmpty && _assignment!['submissionMode'] != 'OFFLINE' && _submission == null) 
                    ? null 
                    : _submitAssignment,
                  icon: _isSubmitting 
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.send),
                  label: Text(_isSubmitting ? 'Submitting...' : 'Submit'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ] else ...[
          const Center(
            child: Text(
              'Assignment Submitted',
              style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
            ),
          ),
        ],
      ],
    );
  }
}
