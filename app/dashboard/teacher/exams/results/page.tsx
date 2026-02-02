"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Trophy, Eye, Download, Filter, TrendingUp, TrendingDown } from "lucide-react";

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

export default function TeacherExamResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchResults();
  }, []);

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

  const filteredResults = results.filter((result) => {
    if (filter === "all") return true;
    if (filter === "published") return result.exam.status === "RESULTS_PUBLISHED";
    if (filter === "pending") return result.exam.status !== "RESULTS_PUBLISHED";
    return true;
  });

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
                View exam results and performance statistics
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary text-dark-900"
                  : "bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-700"
              }`}
            >
              All Results
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
                        onClick={() =>
                          router.push(`/dashboard/teacher/exams/results/${result.id}`)
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          // Download result logic
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
        </div>
      </main>
    </div>
  );
}
