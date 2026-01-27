class ChildModel {
  final String id;
  final String fullName;
  final String admissionNumber;
  final String? profilePhoto;
  final AcademicUnitModel? academicUnit;
  final AcademicYearModel? academicYear;

  ChildModel({
    required this.id,
    required this.fullName,
    required this.admissionNumber,
    this.profilePhoto,
    this.academicUnit,
    this.academicYear,
  });

  factory ChildModel.fromJson(Map<String, dynamic> json) {
    return ChildModel(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      admissionNumber: json['admissionNumber'] ?? '',
      profilePhoto: json['profilePhoto'],
      academicUnit: json['academicUnit'] != null
          ? AcademicUnitModel.fromJson(json['academicUnit'])
          : null,
      academicYear: json['academicYear'] != null
          ? AcademicYearModel.fromJson(json['academicYear'])
          : null,
    );
  }
}

class AcademicUnitModel {
  final String id;
  final String name;

  AcademicUnitModel({
    required this.id,
    required this.name,
  });

  factory AcademicUnitModel.fromJson(Map<String, dynamic> json) {
    return AcademicUnitModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
    );
  }
}

class AcademicYearModel {
  final String id;
  final String name;

  AcademicYearModel({
    required this.id,
    required this.name,
  });

  factory AcademicYearModel.fromJson(Map<String, dynamic> json) {
    return AcademicYearModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
    );
  }
}
