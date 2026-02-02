"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, Lock, ArrowLeft, CheckCircle, AlertCircle, Users } from "lucide-react";

interface Student {
  id: string;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  result?: {
    id: string;
    marksObtained: number;
    isAbsent: boolean;
    isDraft: boolean;
  };
}

interface ExamSchedule {
  id: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  marksEntryStatus: string;
  subject: {
    name: string;
    code: string;
  };
  academicUnit: {
    name: string;
  };
  exam: {
    name: string;
  };
}

export default function TeacherMarksEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("scheduleId");

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ExamSchedule | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<{ [key: string]: { marks: number; absent: boolean } }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleAndStudents(scheduleId);
    }
  }, [scheduleId]);

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/teacher/exam-schedules");
      const data = await res.json();

      if (data.success) {
        setSchedules(data.data || []);
        if (!scheduleId && data.data?.length > 0) {
          const firstPending = data.data.find(
            (s: ExamSchedule) => s.marksEntryStatus !== "LOCKED" && s.marksEntryStatus !== "COMPLETED"
          );
          if (firstPending) {
            router.push(`/teacher/exams/marks-entry?scheduleId=${firstPending.id}`);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleAndStudents = async (id: string) => {
    try {
      setLoading(true);
      const [scheduleRes, studentsRes] = await Promise.all([
        fetch(`/api/teacher/exam-schedules/${id}`),
        fetch(`/api/teacher/exam-schedules/${id}/students`),
      ]);

      const [scheduleData, studentsData] = await Promise.all([
        scheduleRes.json(),
        studentsRes.json(),
      ]);

      if (scheduleData.success) {
        setSelectedSchedule(scheduleData.data);
      }

      if (studentsData.success) {
        setStudents(studentsData.data || []);
        
        const initialMarks: { [key: string]: { marks: number; absent: boolean } } = {};
        studentsData.data.forEach((student: Student) => {
          if (student.result) {
            initialMarks[student.id] = {
              marks: student.result.marksObtained,
              absent: student.result.isAbsent,
            };
          }
        });
        setMarks(initialMarks);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= (selectedSchedule?.maxMarks || 100)) {
      setMarks({
        ...marks,
        [studentId]: { marks: numValue, absent: marks[studentId]?.absent || false },
      });
    } else if (value === "") {
      setMarks({
        ...marks,
        [studentId]: { marks: 0, absent: marks[studentId]?.absent || false },
      });
    }
  };

  const handleAbsentToggle = (studentId: string) => {
    setMarks({
      ...marks,
      [studentId]: {
        marks: marks[studentId]?.marks || 0,
        absent: !marks[studentId]?.absent,
      },
    });
  };

  const saveMarks = async (isDraft: boolean) => {
    if (!scheduleId) return;

    try {
      setSaving(true);

      const marksData = students.map((student) => ({
        studentId: student.id,
        marksObtained: marks[student.id]?.marks || 0,
        isAbsent: marks[student.id]?.absent || false,
      }));

      const res = await fetch(`/api/teacher/exam-schedules/${scheduleId}/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: marksData, isDraft }),
      });

      const data = await res.json();

      if (data.success) {
        alert(isDraft ? "Marks saved as draft" : "Marks submitted successfully");
        fetchScheduleAndStudents(scheduleId);
      } else {
        alert(data.error || "Failed to save marks");
      }
    } catch (error) {
      console.error("Error saving marks:", error);
      alert("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  const calculateStats = () => {
    const totalStudents = students.length;
    const enteredMarks = Object.keys(marks).length;
    const absentCount = Object.values(marks).filter((m) => m.absent).length;
    const presentCount = enteredMarks - absentCount;

    return { totalStudents, enteredMarks, absentCount, presentCount };
  };

  const stats = calculateStats();
  const isLocked = selectedSchedule?.marksEntryStatus === "LOCKED";

  if (loading && !scheduleId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/teacher/exams")}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Exams
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Marks Entry
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter marks for students in your assigned subjects
        </p>
      </div>

      {/* Schedule Selector */}
      <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Exam Schedule
        </label>
        <select
          value={scheduleId || ""}
          onChange={(e) => {
            if (e.target.value) {
              router.push(`/teacher/exams/marks-entry?scheduleId=${e.target.value}`);
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
        >
          <option value="">Select a schedule...</option>
          {schedules.map((schedule) => (
            <option key={schedule.id} value={schedule.id}>
              {schedule.exam.name} - {schedule.subject.name} ({schedule.academicUnit.name}) - {new Date(schedule.examDate).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {scheduleId && selectedSchedule && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Marks Entered</p>
              <p className="text-2xl font-bold text-blue-600">{stats.enteredMarks}</p>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
            </div>
          </div>

          {/* Exam Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                  {selectedSchedule.exam.name} - {selectedSchedule.subject.name}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Max Marks: <strong>{selectedSchedule.maxMarks}</strong> • Passing Marks:{" "}
                  <strong>{selectedSchedule.passingMarks}</strong> • Date:{" "}
                  <strong>{new Date(selectedSchedule.examDate).toLocaleDateString()}</strong> • Class:{" "}
                  <strong>{selectedSchedule.academicUnit.name}</strong>
                </p>
              </div>
            </div>
          </div>

          {isLocked && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                    Marks Entry Locked
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-400">
                    This exam's marks entry has been locked. You cannot make any changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Marks Entry Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No students found for this class</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Admission No.
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Marks (/{selectedSchedule.maxMarks})
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Absent
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {students.map((student, index) => {
                      const isAbsent = marks[student.id]?.absent || false;
                      const studentMarks = marks[student.id]?.marks || 0;
                      const isPassing = studentMarks >= selectedSchedule.passingMarks;

                      return (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {student.rollNumber || index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {student.fullName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {student.admissionNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="number"
                              min="0"
                              max={selectedSchedule.maxMarks}
                              value={marks[student.id]?.marks ?? ""}
                              onChange={(e) => handleMarksChange(student.id, e.target.value)}
                              disabled={isLocked || isAbsent}
                              className="w-24 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-center focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-dark-600 disabled:cursor-not-allowed"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={isAbsent}
                              onChange={() => handleAbsentToggle(student.id)}
                              disabled={isLocked}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isAbsent ? (
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                Absent
                              </span>
                            ) : marks[student.id] !== undefined ? (
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  isPassing
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                }`}
                              >
                                {isPassing ? "Pass" : "Fail"}
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isLocked && students.length > 0 && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => saveMarks(true)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to submit? This will finalize the marks entry.")) {
                    saveMarks(false);
                  }
                }}
                disabled={saving || stats.enteredMarks !== stats.totalStudents}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? "Submitting..." : "Submit Marks"}
              </button>
              {stats.enteredMarks !== stats.totalStudents && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Please enter marks for all {stats.totalStudents - stats.enteredMarks} remaining students
                </p>
              )}
            </div>
          )}
        </>
      )}

      {!scheduleId && schedules.length === 0 && !loading && (
        <div className="bg-white dark:bg-dark-800 rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No exam schedules available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Exam schedules will appear here once they are created for your subjects
          </p>
        </div>
      )}
    </div>
  );
}
