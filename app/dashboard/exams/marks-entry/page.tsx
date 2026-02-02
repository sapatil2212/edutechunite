"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Search, Save, CheckCircle, Users } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  code: string;
}

interface AcademicUnit {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Student {
  id: string;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
}

interface ExamResult {
  id?: string;
  studentId: string;
  student: Student;
  marksObtained?: number;
  isAbsent: boolean;
  remarks?: string;
  isDraft: boolean;
}

export default function MarksEntryPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Map<string, ExamResult>>(new Map());

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchAcademicUnits();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedExam && selectedClass && selectedSubject) {
      fetchStudentsAndResults();
    }
  }, [selectedExam, selectedClass, selectedSubject]);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  const fetchAcademicUnits = async () => {
    try {
      const res = await fetch("/api/institution/academic-units");
      const data = await res.json();
      if (data.success) {
        setAcademicUnits(data.data);
      }
    } catch (error) {
      console.error("Error fetching academic units:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/institution/subjects");
      const data = await res.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchStudentsAndResults = async () => {
    try {
      setLoading(true);
      const [studentsRes, resultsRes] = await Promise.all([
        fetch(`/api/institution/students?academicUnitId=${selectedClass}`),
        fetch(
          `/api/exams/${selectedExam}/marks-entry?academicUnitId=${selectedClass}&subjectId=${selectedSubject}`
        ),
      ]);

      const [studentsData, resultsData] = await Promise.all([
        studentsRes.json(),
        resultsRes.json(),
      ]);

      if (studentsData.success) {
        setStudents(studentsData.data);

        const resultsMap = new Map<string, ExamResult>();
        
        if (resultsData.success && resultsData.data) {
          resultsData.data.forEach((result: ExamResult) => {
            resultsMap.set(result.studentId, result);
          });
        }

        studentsData.data.forEach((student: Student) => {
          if (!resultsMap.has(student.id)) {
            resultsMap.set(student.id, {
              studentId: student.id,
              student: student,
              isAbsent: false,
              isDraft: true,
            });
          }
        });

        setResults(resultsMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateResult = (studentId: string, updates: Partial<ExamResult>) => {
    setResults((prev) => {
      const newResults = new Map(prev);
      const current = newResults.get(studentId);
      if (current) {
        newResults.set(studentId, { ...current, ...updates });
      }
      return newResults;
    });
  };

  const handleSave = async (isDraft: boolean) => {
    if (!selectedExam || !selectedSubject) return;

    setSaving(true);
    try {
      const entries = Array.from(results.values()).map((result) => ({
        studentId: result.studentId,
        subjectId: selectedSubject,
        marksObtained: result.marksObtained,
        isAbsent: result.isAbsent,
        remarks: result.remarks,
        isDraft: isDraft,
      }));

      const res = await fetch(`/api/exams/${selectedExam}/marks-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      const data = await res.json();

      if (data.success) {
        alert(
          isDraft
            ? "Marks saved as draft successfully"
            : "Marks submitted successfully"
        );
        fetchStudentsAndResults();
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Marks Entry
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter and manage student marks for exams
            </p>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Exam *
                </label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                >
                  <option value="">Choose Exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name} ({exam.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Class *
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                >
                  <option value="">Choose Class</option>
                  {academicUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Subject *
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                >
                  <option value="">Choose Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedExam && selectedClass && selectedSubject && (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Loading students...
                  </p>
                </div>
              ) : students.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No students found in this class
                  </p>
                </div>
              ) : (
                <>
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
                            Marks Obtained
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Absent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                        {students.map((student) => {
                          const result = results.get(student.id);
                          if (!result) return null;

                          return (
                            <tr
                              key={student.id}
                              className={`${
                                result.isAbsent
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
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={result.isAbsent}
                                  value={result.marksObtained || ""}
                                  onChange={(e) =>
                                    updateResult(student.id, {
                                      marksObtained: parseFloat(e.target.value) || undefined,
                                    })
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 dark:border-dark-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-dark-600"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={result.isAbsent}
                                  onChange={(e) =>
                                    updateResult(student.id, {
                                      isAbsent: e.target.checked,
                                      marksObtained: e.target.checked ? 0 : undefined,
                                    })
                                  }
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={result.remarks || ""}
                                  onChange={(e) =>
                                    updateResult(student.id, {
                                      remarks: e.target.value,
                                    })
                                  }
                                  placeholder="Add remarks..."
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-dark-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white text-sm"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Students: {students.length} | Absent:{" "}
                      {Array.from(results.values()).filter((r) => r.isAbsent).length}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSave(true)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        Save as Draft
                      </button>
                      <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {saving ? "Submitting..." : "Submit Marks"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
