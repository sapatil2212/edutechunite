import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

class AuthService with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;

  // Change this to your actual backend URL
  // For Android Emulator: 'http://10.0.2.2:3000'
  // For iOS Simulator: 'http://localhost:3000'
  // For Physical Device on same network: 'http://YOUR_PC_IP:3000'
  // For Production: 'https://your-domain.com'
  // static const String baseUrl = 'http://localhost:3000';
  static const String baseUrl = 'http://10.32.106.151:3000'; // Configured for local WiFi access 

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/mobile/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': identifier,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final token = data['token'];
        final userData = data['user'];
        
        _user = UserModel.fromJson(userData, token);
        
        // Save to local storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        await prefs.setString('user', jsonEncode(userData));
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        throw Exception(data['message'] ?? 'Login failed');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }

  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    if (!prefs.containsKey('token')) return;

    final token = prefs.getString('token');
    final userData = jsonDecode(prefs.getString('user')!);
    
    _user = UserModel.fromJson(userData, token);
    notifyListeners();
  }
}
