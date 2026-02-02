"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, Users } from "lucide-react";

interface Student {
  id: string;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
}

interface ExamSchedule {
  id: string;
  examDate: string;
  startTime: string;
  endTime: string;
  subject: {
    name: string;
    code: string;
  };
  academicUnit: {
    name: string;
  };
}

interface AttendanceRecord {
  studentId: string;
  isPresent: boolean;
  arrivalTime?: string;
  departureTime?: string;
  lateArrival: boolean;
  earlyDeparture: boolean;
  remarks?: string;
}

export default function ExamAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [examId]);

  useEffect(() => {
    if (selectedSchedule) {
      fetchStudentsAndAttendance();
    }
  }, [selectedSchedule]);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/schedules`);
      const data = await res.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndAttendance = async () => {
    try {
      setLoading(true);
      const schedule = schedules.find((s) => s.id === selectedSchedule);
      if (!schedule) return;

      const [studentsRes, attendanceRes] = await Promise.all([
        fetch(`/api/institution/students?academicUnitId=${schedule.academicUnit.id}`),
        fetch(`/api/exams/${examId}/attendance?examScheduleId=${selectedSchedule}`),
      ]);

      const [studentsData, attendanceData] = await Promise.all([
        studentsRes.json(),
        attendanceRes.json(),
      ]);

      if (studentsData.success) {
        setStudents(studentsData.data);

        const attendanceMap = new Map<string, AttendanceRecord>();

        if (attendanceData.success && attendanceData.data) {
          attendanceData.data.forEach((record: any) => {
            attendanceMap.set(record.studentId, {
              studentId: record.studentId,
              isPresent: record.isPresent,
              arrivalTime: record.arrivalTime,
              departureTime: record.departureTime,
              lateArrival: record.lateArrival,
              earlyDeparture: record.earlyDeparture,
              remarks: record.remarks,
            });
          });
        }

        studentsData.data.forEach((student: Student) => {
          if (!attendanceMap.has(student.id)) {
            attendanceMap.set(student.id, {
              studentId: student.id,
              isPresent: false,
              lateArrival: false,
              earlyDeparture: false,
            });
          }
        });

        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (studentId: string, updates: Partial<AttendanceRecord>) => {
    setAttendance((prev) => {
      const newAttendance = new Map(prev);
      const current = newAttendance.get(studentId);
      if (current) {
        newAttendance.set(studentId, { ...current, ...updates });
      }
      return newAttendance;
    });
  };

  const markAllPresent = () => {
    const newAttendance = new Map(attendance);
    students.forEach((student) => {
      const current = newAttendance.get(student.id);
      if (current) {
        newAttendance.set(student.id, { ...current, isPresent: true });
      }
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!selectedSchedule) return;

    setSaving(true);
    try {
      const attendanceRecords = Array.from(attendance.values()).map((record) => ({
        studentId: record.studentId,
        isPresent: record.isPresent,
        arrivalTime: record.arrivalTime,
        departureTime: record.departureTime,
        lateArrival: record.lateArrival,
        earlyDeparture: record.earlyDeparture,
        remarks: record.remarks,
      }));

      const res = await fetch(`/api/exams/${examId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examScheduleId: selectedSchedule,
          attendances: attendanceRecords,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Attendance saved successfully");
      } else {
        alert(data.error || "Failed to save attendance");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Array.from(attendance.values()).filter((a) => a.isPresent).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Exam Attendance
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mark student attendance for exam
            </p>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exam Schedule *
            </label>
            <select
              value={selectedSchedule}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
            >
              <option value="">Choose Schedule</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.subject.name} - {schedule.academicUnit.name} ({new Date(schedule.examDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {selectedSchedule && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {students.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {presentCount}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {absentCount}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Late Arrivals</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {Array.from(attendance.values()).filter((a) => a.lateArrival).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No students found</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Student Attendance
                      </h3>
                      <button
                        onClick={markAllPresent}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Mark All Present
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-dark-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Roll No.
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Student Name
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Present
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Late Arrival
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Early Departure
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Remarks
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                          {students.map((student) => {
                            const record = attendance.get(student.id);
                            if (!record) return null;

                            return (
                              <tr
                                key={student.id}
                                className={`${
                                  !record.isPresent
                                    ? "bg-red-50 dark:bg-red-900/10"
                                    : "hover:bg-gray-50 dark:hover:bg-dark-700"
                                } transition-colors`}
                              >
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                  {student.rollNumber || "-"}
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {student.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {student.admissionNumber}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={record.isPresent}
                                    onChange={(e) =>
                                      updateAttendance(student.id, {
                                        isPresent: e.target.checked,
                                      })
                                    }
                                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={record.lateArrival}
                                    disabled={!record.isPresent}
                                    onChange={(e) =>
                                      updateAttendance(student.id, {
                                        lateArrival: e.target.checked,
                                      })
                                    }
                                    className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 disabled:opacity-50"
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={record.earlyDeparture}
                                    disabled={!record.isPresent}
                                    onChange={(e) =>
                                      updateAttendance(student.id, {
                                        earlyDeparture: e.target.checked,
                                      })
                                    }
                                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 disabled:opacity-50"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    value={record.remarks || ""}
                                    onChange={(e) =>
                                      updateAttendance(student.id, {
                                        remarks: e.target.value,
                                      })
                                    }
                                    placeholder="Add remarks..."
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-dark-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600 flex items-center justify-end">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Attendance"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
