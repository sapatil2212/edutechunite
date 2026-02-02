import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';

class StudentResourcesScreen extends StatefulWidget {
  const StudentResourcesScreen({super.key});

  @override
  State<StudentResourcesScreen> createState() => _StudentResourcesScreenState();
}

class _StudentResourcesScreenState extends State<StudentResourcesScreen> {
  bool _isLoading = false;
  List<dynamic> _resources = [];
  String? _selectedSubjectId;
  List<dynamic> _subjects = [];
  String? _academicUnitId;

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final authService = Provider.of<AuthService>(context, listen: false);
      final student = authService.user;

      final profile = await apiService.getProfile();
      _academicUnitId = profile['academicUnit']?['id'] ?? profile['classId'];

      final subjectsRes = await apiService.getSubjects(academicUnitId: _academicUnitId);
      if (subjectsRes['success'] == true) {
        setState(() {
          _subjects = subjectsRes['data'] ?? [];
        });
      }

      await _fetchResources();
    } catch (e) {
      print('Error loading data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchResources() async {
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final res = await apiService.getResources(
        academicUnitId: _academicUnitId,
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

  Future<void> _launchUrl(String url) async {
    if (!await launchUrl(Uri.parse(url))) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch $url')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Resources'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchResources().then((_) => setState(() => _isLoading = false));
            },
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
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => _launchUrl(resource['fileUrl']),
                            ),
                          );
                        },
                      ),
          ),
        ],
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
