"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Trophy, CheckCircle, XCircle, Award, Download } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface ExamResult {
  id: string;
  student: {
    fullName: string;
    admissionNumber: string;
    rollNumber: string;
  };
  subject: {
    name: string;
    code: string;
  };
  maxMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  isPassed: boolean;
  isAbsent: boolean;
  classRank?: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchResults();
    }
  }, [selectedExam]);

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

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${selectedExam}/marks-entry`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data.filter((r: ExamResult) => !r.isAbsent));
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResults = async () => {
    if (!selectedExam) return;

    if (!confirm("Are you sure you want to publish results? This action cannot be undone.")) {
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch(`/api/exams/${selectedExam}/results/publish`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        alert("Results published successfully!");
        fetchExams();
        fetchResults();
      } else {
        alert(data.error || "Failed to publish results");
      }
    } catch (error) {
      console.error("Error publishing results:", error);
      alert("Failed to publish results");
    } finally {
      setPublishing(false);
    }
  };

  const selectedExamData = exams.find((e) => e.id === selectedExam);
  const canPublish = selectedExamData?.status !== "RESULTS_PUBLISHED";

  const passedCount = results.filter((r) => r.isPassed).length;
  const failedCount = results.filter((r) => !r.isPassed).length;
  const averagePercentage =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Exam Results
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and publish exam results
              </p>
            </div>
            {selectedExam && canPublish && results.length > 0 && (
              <button
                onClick={handlePublishResults}
                disabled={publishing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                {publishing ? "Publishing..." : "Publish Results"}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
            >
              <option value="">Choose an exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.code}) - {exam.status}
                </option>
              ))}
            </select>
          </div>

          {selectedExam && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Results
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {results.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Passed
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {passedCount}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Failed
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {failedCount}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Average %
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {averagePercentage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Loading results...
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-8 text-center">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No results found for this exam
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-dark-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Marks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Percentage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Grade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Result
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                        {results.map((result) => (
                          <tr
                            key={result.id}
                            className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {result.classRank || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {result.student.fullName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {result.student.rollNumber} • {result.student.admissionNumber}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {result.subject.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {result.subject.code}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {result.marksObtained} / {result.maxMarks}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {result.percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {result.grade || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {result.isPassed ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                  PASS
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                  FAIL
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
