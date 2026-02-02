import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';

class TeacherResourcesScreen extends StatefulWidget {
  const TeacherResourcesScreen({super.key});

  @override
  State<TeacherResourcesScreen> createState() => _TeacherResourcesScreenState();
}

class _TeacherResourcesScreenState extends State<TeacherResourcesScreen> {
  bool _isLoading = false;
  List<dynamic> _resources = [];
  
  // For filtering
  String? _selectedSubjectId;
  List<dynamic> _subjects = [];

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      // Fetch Subjects
      final subjectsRes = await apiService.getSubjects();
      if (subjectsRes['success'] == true) {
        setState(() {
          _subjects = subjectsRes['data'] ?? [];
        });
      }

      await _fetchResources();
    } catch (e) {
      _showError('Failed to load data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchResources() async {
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final res = await apiService.getResources(
        subjectId: _selectedSubjectId,
      );
      
      if (res['success'] == true) {
        setState(() {
          _resources = res['data'] ?? [];
        });
      }
    } catch (e) {
      print('Error fetching resources: $e');
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
    if (!await launchUrl(Uri.parse(url))) {
      _showError('Could not launch $url');
    }
  }

  void _showAddResourceDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => const AddResourceSheet(),
    ).then((_) => _fetchResources());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resources'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchResources,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Bar
          if (_subjects.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: DropdownButtonFormField<String>(
                value: _selectedSubjectId,
                decoration: const InputDecoration(
                  labelText: 'Filter by Subject',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                items: [
                  const DropdownMenuItem<String>(value: null, child: Text('All Subjects')),
                  ..._subjects.map((s) => DropdownMenuItem(
                    value: s['id'],
                    child: Text(s['name']),
                  )),
                ],
                onChanged: (v) {
                  setState(() => _selectedSubjectId = v);
                  _fetchResources();
                },
              ),
            ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _resources.isEmpty
                    ? const Center(child: Text('No resources found'))
                    : ListView.builder(
                        itemCount: _resources.length,
                        itemBuilder: (context, index) {
                          final resource = _resources[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: ListTile(
                              leading: Icon(_getIconForType(resource['resourceType'])),
                              title: Text(resource['title'] ?? 'Untitled'),
                              subtitle: Text(resource['subject']?['name'] ?? 'General'),
                              trailing: IconButton(
                                icon: const Icon(Icons.open_in_new),
                                onPressed: () => _launchUrl(resource['fileUrl']),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddResourceDialog,
        child: const Icon(Icons.add),
      ),
    );
  }

  IconData _getIconForType(String? type) {
    switch (type) {
      case 'PDF': return Icons.picture_as_pdf;
      case 'VIDEO': return Icons.video_library;
      case 'LINK': return Icons.link;
      case 'IMAGE': return Icons.image;
      case 'AUDIO': return Icons.audiotrack;
      default: return Icons.description;
    }
  }
}

class AddResourceSheet extends StatefulWidget {
  const AddResourceSheet({super.key});

  @override
  State<AddResourceSheet> createState() => _AddResourceSheetState();
}

class _AddResourceSheetState extends State<AddResourceSheet> {
  final _formKey = GlobalKey<FormState>();
  bool _isUploading = false;
  bool _isSubmitting = false;

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  String? _selectedSubjectId;
  String? _selectedClassId;
  String _resourceType = 'PDF';
  
  // File upload
  String? _fileUrl;
  String? _fileName;

  List<dynamic> _subjects = [];
  List<dynamic> _classes = [];

  final List<String> _types = ['PDF', 'VIDEO', 'LINK', 'DOCUMENT', 'IMAGE', 'OTHER'];

  @override
  void initState() {
    super.initState();
    _fetchDropdownData();
  }

  Future<void> _fetchDropdownData() async {
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final subjectsRes = await apiService.getSubjects();
      final classesRes = await apiService.getAcademicUnits(parentId: 'null'); // Classes

      if (mounted) {
        setState(() {
          _subjects = subjectsRes['data'] ?? [];
          _classes = classesRes['data'] ?? [];
        });
      }
    } catch (e) {
      print('Error loading dropdowns: $e');
    }
  }

  Future<void> _pickAndUploadFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'png', 'zip'],
      );

      if (result != null) {
        setState(() => _isUploading = true);
        final file = File(result.files.single.path!);
        final apiService = Provider.of<ApiService>(context, listen: false);
        
        final res = await apiService.uploadFile(file.path, 'resources');
        
        if (res['success'] == true) {
          setState(() {
            _fileUrl = res['url'];
            _fileName = result.files.single.name;
          });
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload failed: $e')),
      );
    } finally {
      setState(() => _isUploading = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_fileUrl == null && _resourceType != 'LINK') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload a file or provide a link')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      final payload = {
        'title': _titleController.text,
        'description': _descriptionController.text,
        'resourceType': _resourceType,
        'fileUrl': _fileUrl, // For LINK type, we might want a text field, but let's reuse this
        'subjectId': _selectedSubjectId,
        'academicUnitId': _selectedClassId,
      };

      await apiService.createResource(payload);
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Resource added successfully')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add resource: $e')),
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16,
        right: 16,
        top: 16,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Add Resource', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Title'),
              validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            
            DropdownButtonFormField<String>(
              value: _resourceType,
              decoration: const InputDecoration(labelText: 'Type'),
              items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (v) => setState(() => _resourceType = v!),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedClassId,
                    decoration: const InputDecoration(labelText: 'Class (Optional)'),
                    items: _classes.map<DropdownMenuItem<String>>((c) {
                      return DropdownMenuItem(value: c['id'], child: Text(c['name']));
                    }).toList(),
                    onChanged: (v) => setState(() => _selectedClassId = v),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedSubjectId,
                    decoration: const InputDecoration(labelText: 'Subject (Optional)'),
                    items: _subjects.map<DropdownMenuItem<String>>((s) {
                      return DropdownMenuItem(value: s['id'], child: Text(s['name']));
                    }).toList(),
                    onChanged: (v) => setState(() => _selectedSubjectId = v),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_resourceType == 'LINK')
              TextFormField(
                decoration: const InputDecoration(labelText: 'External Link URL'),
                onChanged: (v) => _fileUrl = v,
                validator: (v) => _resourceType == 'LINK' && (v?.isEmpty ?? true) ? 'Required' : null,
              )
            else
              Row(
                children: [
                  Expanded(
                    child: Text(_fileName ?? 'No file selected'),
                  ),
                  TextButton.icon(
                    onPressed: _isUploading ? null : _pickAndUploadFile,
                    icon: _isUploading 
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.upload_file),
                    label: const Text('Upload'),
                  ),
                ],
              ),
            
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting 
                ? const CircularProgressIndicator(color: Colors.white) 
                : const Text('Save Resource'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
