"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { 
  User, Mail, Phone, Calendar, MapPin, Edit2, Save, X, 
  GraduationCap, Hash, Droplet, Globe, AlertCircle, Users,
  Building, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Guardian {
  id: string;
  fullName: string;
  relationship: string;
  email: string | null;
  phone: string;
  occupation: string | null;
}

interface StudentGuardian {
  relationship: string;
  isPrimary: boolean;
  canPickup: boolean;
  guardian: Guardian;
}

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  emergencyContact: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  profilePhoto: string | null;
  rollNumber: string | null;
  status: string;
  classId: string | null;
  className: string | null;
  sectionId: string | null;
  sectionName: string | null;
  academicYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  academicUnit: {
    id: string;
    name: string;
    type: string;
    parent?: {
      id: string;
      name: string;
    } | null;
  };
  course: {
    id: string;
    name: string;
  } | null;
  school: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    phone: string | null;
    email: string | null;
    logo: string | null;
  };
  guardians: StudentGuardian[];
}

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    nationality: "",
    email: "",
    phone: "",
    emergencyContact: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/student/profile");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch profile");
      }

      if (result.success) {
        setStudent(result.data);
        setFormData({
          firstName: result.data.firstName || "",
          middleName: result.data.middleName || "",
          lastName: result.data.lastName || "",
          dateOfBirth: result.data.dateOfBirth ? result.data.dateOfBirth.split('T')[0] : "",
          gender: result.data.gender || "",
          bloodGroup: result.data.bloodGroup || "",
          nationality: result.data.nationality || "",
          email: result.data.email || "",
          phone: result.data.phone || "",
          emergencyContact: result.data.emergencyContact || "",
          address: result.data.address || "",
          city: result.data.city || "",
          state: result.data.state || "",
          pincode: result.data.pincode || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      if (result.success) {
        setStudent(result.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (student) {
      setFormData({
        firstName: student.firstName || "",
        middleName: student.middleName || "",
        lastName: student.lastName || "",
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : "",
        gender: student.gender || "",
        bloodGroup: student.bloodGroup || "",
        nationality: student.nationality || "",
        email: student.email || "",
        phone: student.phone || "",
        emergencyContact: student.emergencyContact || "",
        address: student.address || "",
        city: student.city || "",
        state: student.state || "",
        pincode: student.pincode || "",
      });
    }
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "GRADUATED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                My Profile
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and manage your profile information
              </p>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={saving}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : !student ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No profile data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex flex-col items-center">
                    {student.profilePhoto ? (
                      <img
                        src={student.profilePhoto}
                        alt={student.fullName}
                        className="w-24 h-24 rounded-full object-cover mb-4"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-dark-900 text-3xl font-bold mb-4">
                        {student.fullName.charAt(0)}
                      </div>
                    )}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 text-center">
                      {student.fullName}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {student.admissionNumber}
                    </p>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Academic Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Class</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.className || student.academicUnit.parent?.name || student.academicUnit.name}
                      </p>
                    </div>
                    {(student.sectionName || (student.academicUnit.parent && student.academicUnit.name)) && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Section</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.sectionName || student.academicUnit.name}
                        </p>
                      </div>
                    )}
                    {student.rollNumber && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Roll Number</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.rollNumber}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Academic Year</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.academicYear.name}
                      </p>
                    </div>
                    {student.course && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Course</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.course.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* School Info */}
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    School Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">School Name</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.school.name}
                      </p>
                    </div>
                    {student.school.phone && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.school.phone}
                        </p>
                      </div>
                    )}
                    {student.school.email && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.school.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Cards */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">First Name</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.firstName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Middle Name</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.middleName}
                            onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.middleName || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Last Name</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                        {isEditing ? (
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(new Date(student.dateOfBirth), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Gender</p>
                        {isEditing ? (
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.gender}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Droplet className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Blood Group</p>
                        {isEditing ? (
                          <select
                            value={formData.bloodGroup}
                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A_POSITIVE">A+</option>
                            <option value="A_NEGATIVE">A-</option>
                            <option value="B_POSITIVE">B+</option>
                            <option value="B_NEGATIVE">B-</option>
                            <option value="AB_POSITIVE">AB+</option>
                            <option value="AB_NEGATIVE">AB-</option>
                            <option value="O_POSITIVE">O+</option>
                            <option value="O_NEGATIVE">O-</option>
                          </select>
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.bloodGroup || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Nationality</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.nationality}
                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.nationality || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        {isEditing ? (
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.email || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.phone || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 md:col-span-2">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Contact</p>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.emergencyContact}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.emergencyContact || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Address Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                        {isEditing ? (
                          <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={3}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.address || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">City</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.city || "Not specified"}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">State</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.state || "Not specified"}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pincode</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.pincode || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guardian Information */}
                {student.guardians && student.guardians.length > 0 && (
                  <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Guardian Information
                    </h3>
                    <div className="space-y-4">
                      {student.guardians.map((sg, index) => (
                        <div
                          key={sg.guardian.id}
                          className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {sg.guardian.fullName}
                            </h4>
                            <div className="flex gap-2">
                              {sg.isPrimary && (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
                                  Primary
                                </span>
                              )}
                              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {sg.relationship}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {sg.guardian.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  {sg.guardian.email}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {sg.guardian.phone}
                              </span>
                            </div>
                            {sg.guardian.occupation && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  {sg.guardian.occupation}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
