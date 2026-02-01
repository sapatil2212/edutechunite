import 'package:flutter/material.dart';
import '../widgets/app_drawer.dart';
import '../widgets/profile_content.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      drawer: AppDrawer(currentRoute: '/profile'),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Profile',
          style: TextStyle(color: Color(0xFF0A0A0A), fontWeight: FontWeight.bold),
        ),
      ),
      body: const ProfileContent(),
    );
  }
}
