"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, Eye, Download, TrendingUp, TrendingDown, ArrowLeft, Users } from "lucide-react";

interface ExamResult {
  id: string;
  exam: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  subject: {
    name: string;
    code: string;
  };
  academicUnit: {
    name: string;
  };
  stats: {
    totalStudents: number;
    appeared: number;
    passed: number;
    failed: number;
    absent: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
    passPercentage: number;
  };
}

interface StudentResult {
  id: string;
  studentId: string;
  student: {
    fullName: string;
    admissionNumber: string;
    rollNumber: string;
  };
  marksObtained: number;
  percentage: number;
  grade: string;
  isPassed: boolean;
  isAbsent: boolean;
}

export default function TeacherExamResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("scheduleId");

  const [results, setResults] = useState<ExamResult[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    if (scheduleId) {
      fetchStudentResults(scheduleId);
    }
  }, [scheduleId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/exam-results");
      const data = await res.json();

      if (data.success) {
        setResults(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentResults = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teacher/exam-schedules/${id}/results`);
      const data = await res.json();

      if (data.success) {
        setStudentResults(data.data.results || []);
        setSelectedResult(data.data.schedule || null);
        setViewMode("detail");
      }
    } catch (error) {
      console.error("Error fetching student results:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((result) => {
    if (filter === "all") return true;
    if (filter === "published") return result.exam.status === "RESULTS_PUBLISHED";
    if (filter === "pending") return result.exam.status !== "RESULTS_PUBLISHED";
    return true;
  });

  const handleViewDetails = (result: ExamResult) => {
    router.push(`/teacher/exams/results?scheduleId=${result.id}`);
  };

  const handleBackToList = () => {
    router.push("/teacher/exams/results");
    setViewMode("list");
    setSelectedResult(null);
    setStudentResults([]);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => viewMode === "detail" ? handleBackToList() : router.push("/teacher/exams")}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        {viewMode === "detail" ? "Back to Results" : "Back to Exams"}
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {viewMode === "detail" && selectedResult
              ? `${selectedResult.exam.name} - ${selectedResult.subject.name}`
              : "Exam Results"}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {viewMode === "detail" && selectedResult
              ? `Results for ${selectedResult.academicUnit.name}`
              : "View exam results and performance statistics"}
          </p>
        </div>
      </div>

      {viewMode === "list" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary text-dark-900"
                  : "bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-700"
              }`}
            >
              All Results ({results.length})
            </button>
            <button
              onClick={() => setFilter("published")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "published"
                  ? "bg-primary text-dark-900"
                  : "bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-700"
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "pending"
                  ? "bg-primary text-dark-900"
                  : "bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-700"
              }`}
            >
              Pending
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No exam results found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Results will appear here once marks are entered and processed
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {result.exam.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {result.subject.name} • {result.academicUnit.name}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          result.exam.status === "RESULTS_PUBLISHED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        }`}
                      >
                        {result.exam.status === "RESULTS_PUBLISHED" ? "Published" : "Pending"}
                      </span>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {result.stats.totalStudents}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">Passed</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {result.stats.passed}
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                        <p className="text-xs text-red-600 dark:text-red-400 mb-1">Failed</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {result.stats.failed}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Absent</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {result.stats.absent}
                        </p>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Average Marks</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {result.stats.averageMarks.toFixed(2)}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Highest Marks</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {result.stats.highestMarks}
                          </p>
                        </div>
                        <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Pass %</p>
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {result.stats.passPercentage.toFixed(1)}%
                          </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                      <button
                        onClick={() => handleViewDetails(result)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          alert("Download functionality will be implemented");
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === "detail" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading student results...</p>
            </div>
          ) : studentResults.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No student results found</p>
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
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {studentResults.map((result, index) => (
                      <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {result.student.rollNumber || index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.student.fullName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {result.student.admissionNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.isAbsent ? "-" : result.marksObtained}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {result.isAbsent ? "-" : `${result.percentage.toFixed(2)}%`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            {result.isAbsent ? "-" : result.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {result.isAbsent ? (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                              Absent
                            </span>
                          ) : (
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${
                                result.isPassed
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                              }`}
                            >
                              {result.isPassed ? "Pass" : "Fail"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
