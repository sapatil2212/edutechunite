class UserModel {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? schoolId;
  final String? studentId;
  final String? guardianId;
  final String? token;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.schoolId,
    this.studentId,
    this.guardianId,
    this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json, String? token) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      role: json['role'],
      schoolId: json['schoolId'],
      studentId: json['studentId'],
      guardianId: json['guardianId'],
      token: token,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'schoolId': schoolId,
      'studentId': studentId,
      'guardianId': guardianId,
    };
  }
}
