import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'screens/login_screen.dart';
import 'screens/student_dashboard.dart';
import 'screens/parent_dashboard.dart';
import 'screens/teacher_dashboard.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ProxyProvider<AuthService, ApiService>(
          update: (_, auth, __) => ApiService(auth),
        ),
      ],
      child: const EduManageApp(),
    ),
  );
}

class EduManageApp extends StatelessWidget {
  const EduManageApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EduManage',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE5F33C),
          primary: const Color(0xFFE5F33C),
          secondary: const Color(0xFF0A0A0A),
        ),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(),
        cardTheme: const CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
          color: Colors.white,
        ),
      ),
      home: const SplashScreen(),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    await authService.tryAutoLogin();
    
    if (mounted) {
      if (authService.isAuthenticated) {
        final role = authService.user?.role;
        Widget nextScreen;
        if (role == 'PARENT') {
          nextScreen = const ParentDashboard();
        } else if (role == 'TEACHER' || role == 'STAFF') {
          nextScreen = const TeacherDashboard();
        } else {
          nextScreen = const StudentDashboard();
        }
        
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => nextScreen,
          ),
        );
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE5F33C),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Center(
                child: Text(
                  'E',
                  style: TextStyle(fontSize: 50, fontWeight: FontWeight.bold, color: Color(0xFF0A0A0A)),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(color: Color(0xFF0A0A0A)),
          ],
        ),
      ),
    );
  }
}
