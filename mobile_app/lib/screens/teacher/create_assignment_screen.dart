import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import '../../services/api_service.dart';

class CreateAssignmentScreen extends StatefulWidget {
  final Map<String, dynamic>? assignment;

  const CreateAssignmentScreen({super.key, this.assignment});

  @override
  State<CreateAssignmentScreen> createState() => _CreateAssignmentScreenState();
}

class _CreateAssignmentScreenState extends State<CreateAssignmentScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Controllers
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _instructionsController = TextEditingController();
  final _maxMarksController = TextEditingController();

  // Selections
  String? _selectedAcademicYearId;
  String? _selectedAcademicUnitId; // Class
  String? _selectedSectionId;
  String? _selectedSubjectId;
  String _selectedType = 'HOMEWORK';
  String _selectedCategory = 'INDIVIDUAL';
  String _selectedSubmissionMode = 'ONLINE';
  
  DateTime _dueDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _dueTime = const TimeOfDay(hour: 23, minute: 59);
  bool _allowLateSubmission = false;
  bool _allowResubmission = false;

  // Data Sources
  List<dynamic> _academicYears = [];
  List<dynamic> _classes = []; // Academic Units
  List<dynamic> _sections = [];
  List<dynamic> _subjects = [];
  List<dynamic> _teacherClasses = []; // Teacher's assigned classes with subjects
  
  // Attachments
  List<Map<String, dynamic>> _attachments = [];
  bool _isUploading = false;
  Map<String, dynamic>? _localAssignmentData;

  final List<String> _types = ['HOMEWORK', 'PRACTICE', 'PROJECT', 'ACTIVITY', 'ASSESSMENT'];
  final List<String> _categories = ['INDIVIDUAL', 'GROUP'];
  final List<String> _modes = ['ONLINE', 'OFFLINE', 'BOTH'];

  @override
  void initState() {
    super.initState();
    _localAssignmentData = widget.assignment;
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      // Fetch Academic Years
      final yearsRes = await apiService.getAcademicYears();
      if (yearsRes['success'] == true) {
        final years = yearsRes['data'] as List;
        setState(() {
          _academicYears = years;
          // Select current year
          final currentYear = years.firstWhere(
            (y) => y['isCurrent'] == true,
            orElse: () => years.isNotEmpty ? years.first : null,
          );
          if (currentYear != null) {
            _selectedAcademicYearId = currentYear['id'];
          }
        });
      }

      // Fetch Teacher's Classes (which includes assigned subjects)
      final classesRes = await apiService.getTeacherClasses();
      if (classesRes['success'] == true) {
        final data = classesRes['data'];
        
        // Merge classes by ID and combine subjects
        final Map<String, dynamic> classMap = {};
        
        // Add class teacher classes first
        for (var cls in (data['classTeacherClasses'] ?? [])) {
          classMap[cls['id']] = {
            ...cls,
            'subjects': <dynamic>[], // Initialize empty subjects list
          };
        }
        
        // Add/merge subject teacher classes
        for (var cls in (data['subjectTeacherClasses'] ?? [])) {
          if (classMap.containsKey(cls['id'])) {
            // Class already exists, add subjects
            classMap[cls['id']]!['subjects'] = cls['subjects'] ?? [];
          } else {
            // New class
            classMap[cls['id']] = cls;
          }
        }
        
        final List<dynamic> mergedClasses = classMap.values.toList();
        
        print('=== MERGED CLASSES ===');
        for (var cls in mergedClasses) {
          print('Class: ${cls['name']}, Subjects: ${cls['subjects']}');
        }
        
        setState(() {
          _teacherClasses = mergedClasses;
        });
      }

      // Use teacher classes as the main class list for consistency
      if (_teacherClasses.isNotEmpty) {
        setState(() {
          _classes = _teacherClasses;
        });
      }

      // If editing, fetch full details and override selections
      if (widget.assignment != null) {
        try {
          final detailsRes = await apiService.getAssignmentDetails(widget.assignment!['id']);
          // Handle both response formats
          if (detailsRes['success'] == true && detailsRes['data'] != null) {
            _localAssignmentData = detailsRes['data'];
          } else if (detailsRes['assignment'] != null) {
            _localAssignmentData = detailsRes['assignment'];
          }
        } catch (e) {
          print('Error fetching assignment details: $e');
        }
        _loadAssignmentData();
      }

    } catch (e) {
      _showError('Failed to load initial data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _loadAssignmentData() {
    final a = _localAssignmentData!;
    _titleController.text = a['title'] ?? '';
    _descriptionController.text = a['description'] ?? '';
    _instructionsController.text = a['instructions'] ?? '';
    _maxMarksController.text = a['maxMarks']?.toString() ?? '';
    
    _selectedAcademicYearId = a['academicYearId'];
    _selectedAcademicUnitId = a['academicUnitId'];
    _selectedSectionId = a['sectionId'];
    _selectedSubjectId = a['subjectId'];
    _selectedType = a['type'] ?? 'HOMEWORK';
    _selectedCategory = a['category'] ?? 'INDIVIDUAL';
    _selectedSubmissionMode = a['submissionMode'] ?? 'ONLINE';
    _allowLateSubmission = a['allowLateSubmission'] ?? false;
    _allowResubmission = a['allowResubmission'] ?? false;

    if (a['dueDate'] != null) {
      final dt = DateTime.parse(a['dueDate']);
      _dueDate = dt;
      _dueTime = TimeOfDay.fromDateTime(dt);
    }

    if (a['attachments'] != null) {
      _attachments = List<Map<String, dynamic>>.from(a['attachments']);
    }

    // Trigger section load if class is selected (using teacher classes)
    if (_selectedAcademicUnitId != null) {
      _onClassChanged(_selectedAcademicUnitId);
      // Restore section ID (it gets cleared in _onClassChanged)
      setState(() {
        _selectedSectionId = a['sectionId'];
      });
    }
  }

  // No longer needed - using teacher classes directly
  // Future<void> _fetchClasses() async {
  //   if (_selectedAcademicYearId == null) return;
  //   try {
  //     final apiService = Provider.of<ApiService>(context, listen: false);
  //     final res = await apiService.getAcademicUnits(
  //       academicYearId: _selectedAcademicYearId,
  //       parentId: 'null', // Fetch top level units (Classes)
  //       includeChildren: true,
  //     );
  //     
  //     if (res['success'] == true) {
  //       setState(() {
  //         _classes = res['data'] ?? [];
  //       });
  //     }
  //   } catch (e) {
  //     print('Error fetching classes: $e');
  //   }
  // }

  void _onClassChanged(String? classId) {
    setState(() {
      _selectedAcademicUnitId = classId;
      _selectedSectionId = null;
      _selectedSubjectId = null;
      _sections = [];
      _subjects = [];
    });

    if (classId != null) {
      // Find selected class (now using teacher classes list)
      final selectedClass = _classes.firstWhere((c) => c['id'] == classId, orElse: () => null);
      
      print('=== CLASS SELECTED ===');
      print('Selected Class ID: $classId');
      print('Found Class: ${selectedClass != null ? selectedClass['name'] : 'null'}');
      print('Subjects in class: ${selectedClass?['subjects']}');
      
      if (selectedClass != null) {
        // Set sections if available
        if (selectedClass['children'] != null) {
          setState(() {
            _sections = selectedClass['children'];
          });
        }
        
        // Set subjects if available
        if (selectedClass['subjects'] != null) {
          print('Setting ${selectedClass['subjects'].length} subjects to dropdown');
          setState(() {
            _subjects = selectedClass['subjects'];
          });
        } else {
          print('No subjects for this class');
        }
      }
    }
  }

  Future<void> _pickAndUploadFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'png', 'zip'],
        withData: true, // Get bytes for web compatibility
      );

      if (result != null) {
        setState(() => _isUploading = true);
        final apiService = Provider.of<ApiService>(context, listen: false);
        
        // Use bytes if available (web), otherwise use path (mobile)
        final fileData = result.files.single.bytes ?? result.files.single.path;
        
        if (fileData == null) {
          _showError('Unable to read file');
          setState(() => _isUploading = false);
          return;
        }
        
        final res = await apiService.uploadFile(
          fileData, 
          'assignments',
          fileName: result.files.single.name,
        );
        
        if (res['success'] == true) {
          setState(() {
            _attachments.add({
              'type': 'FILE',
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

  Future<void> _submitAssignment(String status) async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedAcademicUnitId == null) {
      _showError('Please select a class');
      return;
    }
    if (_selectedSubjectId == null) {
      _showError('Please select a subject');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      final dueDateTime = DateTime(
        _dueDate.year,
        _dueDate.month,
        _dueDate.day,
        _dueTime.hour,
        _dueTime.minute,
      );

      final payload = {
        'title': _titleController.text,
        'description': _descriptionController.text,
        'instructions': _instructionsController.text,
        'academicYearId': _selectedAcademicYearId,
        'academicUnitId': _selectedAcademicUnitId,
        'sectionId': _selectedSectionId, // Optional
        'subjectId': _selectedSubjectId,
        'type': _selectedType,
        'category': _selectedCategory,
        'submissionMode': _selectedSubmissionMode,
        'maxMarks': _maxMarksController.text.isNotEmpty ? int.tryParse(_maxMarksController.text) : null,
        'dueDate': dueDateTime.toIso8601String(),
        'dueTime': '${_dueTime.hour.toString().padLeft(2, '0')}:${_dueTime.minute.toString().padLeft(2, '0')}',
        'allowLateSubmission': _allowLateSubmission,
        'allowResubmission': _allowResubmission,
        'status': status, // 'DRAFT' or 'PUBLISHED'
        'attachments': _attachments,
      };

      Map<String, dynamic> response;
      if (widget.assignment != null) {
        response = await apiService.updateAssignment(widget.assignment!['id'], payload);
      } else {
        response = await apiService.createAssignment(payload);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Assignment ${widget.assignment != null ? 'updated' : (status == 'DRAFT' ? 'saved' : 'published')} successfully')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      _showError('Failed to ${widget.assignment != null ? 'update' : 'create'} assignment: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.assignment != null ? 'Edit Assignment' : 'Create Assignment'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save_outlined),
            onPressed: _isLoading ? null : () => _submitAssignment('DRAFT'),
            tooltip: 'Save as Draft',
          ),
        ],
      ),
      body: _isLoading && _academicYears.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Title',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  // Class and Section Row
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedAcademicUnitId,
                          decoration: const InputDecoration(
                            labelText: 'Class',
                            border: OutlineInputBorder(),
                          ),
                          items: _classes.map<DropdownMenuItem<String>>((c) {
                            return DropdownMenuItem(
                              value: c['id'],
                              child: Text(c['name']),
                            );
                          }).toList(),
                          onChanged: _onClassChanged,
                          validator: (v) => v == null ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedSectionId,
                          decoration: const InputDecoration(
                            labelText: 'Section (Optional)',
                            border: OutlineInputBorder(),
                          ),
                          items: _sections.map<DropdownMenuItem<String>>((s) {
                            return DropdownMenuItem(
                              value: s['id'],
                              child: Text(s['name']),
                            );
                          }).toList(),
                          onChanged: (v) => setState(() => _selectedSectionId = v),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Subject
                  DropdownButtonFormField<String>(
                    value: _selectedSubjectId,
                    decoration: const InputDecoration(
                      labelText: 'Subject',
                      border: OutlineInputBorder(),
                    ),
                    items: _subjects.map<DropdownMenuItem<String>>((s) {
                      return DropdownMenuItem(
                        value: s['id'],
                        child: Text(s['name']),
                      );
                    }).toList(),
                    onChanged: (v) => setState(() => _selectedSubjectId = v),
                    validator: (v) => v == null ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),

                  // Type and Mode
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedType,
                          decoration: const InputDecoration(
                            labelText: 'Type',
                            border: OutlineInputBorder(),
                          ),
                          items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                          onChanged: (v) => setState(() => _selectedType = v!),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedSubmissionMode,
                          decoration: const InputDecoration(
                            labelText: 'Submission',
                            border: OutlineInputBorder(),
                          ),
                          items: _modes.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
                          onChanged: (v) => setState(() => _selectedSubmissionMode = v!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _instructionsController,
                    decoration: const InputDecoration(
                      labelText: 'Instructions',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),

                  // Due Date & Time
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () async {
                            final date = await showDatePicker(
                              context: context,
                              initialDate: _dueDate,
                              firstDate: DateTime.now(),
                              lastDate: DateTime.now().add(const Duration(days: 365)),
                            );
                            if (date != null) setState(() => _dueDate = date);
                          },
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Due Date',
                              border: OutlineInputBorder(),
                              suffixIcon: Icon(Icons.calendar_today),
                            ),
                            child: Text(DateFormat('MMM dd, yyyy').format(_dueDate)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: InkWell(
                          onTap: () async {
                            final time = await showTimePicker(
                              context: context,
                              initialTime: _dueTime,
                            );
                            if (time != null) setState(() => _dueTime = time);
                          },
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Due Time',
                              border: OutlineInputBorder(),
                              suffixIcon: Icon(Icons.access_time),
                            ),
                            child: Text(_dueTime.format(context)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Max Marks
                  TextFormField(
                    controller: _maxMarksController,
                    decoration: const InputDecoration(
                      labelText: 'Max Marks (Optional)',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  
                  // Checkboxes
                  CheckboxListTile(
                    title: const Text('Allow Late Submission'),
                    value: _allowLateSubmission,
                    onChanged: (v) => setState(() => _allowLateSubmission = v!),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),
                  CheckboxListTile(
                    title: const Text('Allow Resubmission'),
                    value: _allowResubmission,
                    onChanged: (v) => setState(() => _allowResubmission = v!),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),

                  const Divider(),
                  const Text('Attachments', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  
                  ..._attachments.map((file) => ListTile(
                    leading: const Icon(Icons.attach_file),
                    title: Text(file['fileName'] ?? 'Unknown'),
                    subtitle: Text(file['type']),
                    trailing: IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () {
                        setState(() {
                          _attachments.remove(file);
                        });
                      },
                    ),
                  )),

                  if (_isUploading)
                    const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Center(child: CircularProgressIndicator()),
                    ),

                  OutlinedButton.icon(
                    onPressed: _isUploading ? null : _pickAndUploadFile,
                    icon: const Icon(Icons.upload_file),
                    label: const Text('Upload File'),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : () => _submitAssignment('PUBLISHED'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).primaryColor,
                        foregroundColor: Colors.white,
                      ),
                      child: _isLoading 
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(widget.assignment != null ? 'Update Assignment' : 'Publish Assignment'),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }
}