import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../screens/login_screen.dart';

class ProfileContent extends StatefulWidget {
  const ProfileContent({super.key});

  @override
  State<ProfileContent> createState() => _ProfileContentState();
}

class _ProfileContentState extends State<ProfileContent> {
  bool _isLoading = false;
  Map<String, dynamic>? _profileData;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    setState(() => _isLoading = true);
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final apiService = Provider.of<ApiService>(context, listen: false);
      
      Map<String, dynamic> data;
      if (authService.user?.role == 'TEACHER') {
        final response = await apiService.getTeacherProfile();
        data = response['data'] ?? {};
      } else {
        data = await apiService.getProfile();
      }
      
      if (mounted) {
        setState(() {
          _profileData = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error fetching profile: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _editProfile() async {
    if (_profileData == null) return;

    final fullNameController = TextEditingController(text: _profileData!['fullName']);
    final phoneController = TextEditingController(text: _profileData!['phone']);
    final addressController = TextEditingController(text: _profileData!['address']);
    final qualController = TextEditingController(text: _profileData!['qualification']);
    final specController = TextEditingController(text: _profileData!['specialization']);
    final expController = TextEditingController(text: _profileData!['experience']?.toString());

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('Edit Profile', style: TextStyle(color: Color(0xFF1F2937))),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildTextField(fullNameController, 'Full Name'),
              const SizedBox(height: 12),
              _buildTextField(phoneController, 'Phone'),
              const SizedBox(height: 12),
              _buildTextField(addressController, 'Address'),
              const SizedBox(height: 12),
              _buildTextField(qualController, 'Qualification'),
              const SizedBox(height: 12),
              _buildTextField(specController, 'Specialization'),
              const SizedBox(height: 12),
              _buildTextField(expController, 'Experience (Years)', isNumber: true),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              _saveProfile({
                'fullName': fullNameController.text,
                'phone': phoneController.text,
                'address': addressController.text,
                'qualification': qualController.text,
                'specialization': specController.text,
                'experience': int.tryParse(expController.text),
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1F2937),
              foregroundColor: const Color(0xFFEDF874),
            ),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, {bool isNumber = false}) {
    return TextField(
      controller: controller,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF1F2937), width: 2),
        ),
      ),
    );
  }

  Future<void> _saveProfile(Map<String, dynamic> updates) async {
    setState(() => _isLoading = true);
    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      await apiService.updateTeacherProfile(updates);
      await _fetchProfile(); // Refresh
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update profile: $e')),
        );
      }
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthService>(context).user;
    final profile = _profileData ?? {};

    if (_isLoading && _profileData == null) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFEDF874)));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
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
              children: [
                Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: const Color(0xFFEDF874),
                      child: Text(
                        user?.name.substring(0, 1).toUpperCase() ?? 'U',
                        style: const TextStyle(
                          fontSize: 40,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: _editProfile,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Color(0xFF1F2937),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.edit, color: Color(0xFFEDF874), size: 16),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  profile['fullName'] ?? user?.name ?? 'User Name',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? 'user@example.com',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[500],
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F2937).withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    user?.role ?? 'STUDENT',
                    style: const TextStyle(
                      color: Color(0xFF1F2937),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _buildSection(
            title: 'Personal Information',
            children: [
              _buildInfoRow(Icons.phone, 'Phone', profile['phone'] ?? '-'),
              _buildInfoRow(Icons.calendar_today, 'Date of Birth', profile['dob'] != null ? profile['dob'].toString().split('T')[0] : '-'),
              _buildInfoRow(Icons.location_on, 'Address', profile['address'] ?? '-'),
            ],
          ),
          const SizedBox(height: 20),
          if (user?.role == 'STUDENT')
            _buildSection(
              title: 'Academic Information',
              children: [
                _buildInfoRow(Icons.school, 'Class', profile['className'] ?? '-'),
                _buildInfoRow(Icons.confirmation_number, 'Roll Number', profile['rollNumber'] ?? '-'),
                _buildInfoRow(Icons.date_range, 'Admission Date', profile['admissionDate'] ?? '-'),
              ],
            )
          else
            _buildSection(
              title: 'Professional Information',
              children: [
                _buildInfoRow(Icons.badge, 'Employee ID', profile['employeeId'] ?? '-'),
                _buildInfoRow(Icons.work, 'Qualification', profile['qualification'] ?? '-'),
                _buildInfoRow(Icons.star, 'Specialization', profile['specialization'] ?? '-'),
                _buildInfoRow(Icons.timeline, 'Experience', '${profile['experience'] ?? 0} Years'),
              ],
            ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () {
              Provider.of<AuthService>(context, listen: false).logout();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            },
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              minimumSize: const Size(double.infinity, 50),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildSection({required String title, required List<Widget> children}) {
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
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              if (title == 'Personal Information') // Show edit icon for personal info
                IconButton(
                  icon: const Icon(Icons.edit, size: 20, color: Color(0xFF1F2937)),
                  onPressed: _editProfile,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
            ],
          ),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF1F2937).withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: const Color(0xFF1F2937), size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
