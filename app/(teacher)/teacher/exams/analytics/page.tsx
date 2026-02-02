"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Award, Users, BookOpen, ArrowLeft, BarChart3 } from "lucide-react";

interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalExams: number;
  averagePassPercentage: number;
  averageMarks: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
}

interface OverallStats {
  totalExams: number;
  totalStudentsEvaluated: number;
  overallPassPercentage: number;
  overallAverageMarks: number;
  topPerformingSubject: string;
  needsImprovementSubject: string;
}

interface TopPerformer {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  averageMarks: number;
  totalExams: number;
}

export default function TeacherExamAnalyticsPage() {
  const router = useRouter();
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/exam-analytics");
      const data = await res.json();

      if (data.success) {
        setOverallStats(data.overallStats || null);
        setSubjectAnalytics(data.subjectAnalytics || []);
        setTopPerformers(data.topPerformers || []);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

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
          Exam Analytics
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Performance insights and trends for your subjects
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-3 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Overall Stats */}
          {overallStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Exams</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {overallStats.totalExams}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Students Evaluated</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {overallStats.totalStudentsEvaluated}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pass Percentage</p>
                    <p className="text-3xl font-bold text-green-600">
                      {overallStats.overallPassPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Marks</p>
                    <p className="text-3xl font-bold text-amber-600">
                      {overallStats.overallAverageMarks.toFixed(1)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subject-wise Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
              <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Subject Performance
                </h2>
              </div>

              {subjectAnalytics.length === 0 ? (
                <div className="p-8 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No subject data available</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-dark-700">
                  {subjectAnalytics.map((subject) => (
                    <div key={subject.subjectId} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {subject.subjectName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {subject.subjectCode} • {subject.totalExams} exams
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {subject.trend === "up" ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : subject.trend === "down" ? (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          ) : (
                            <div className="w-4 h-4 bg-gray-400 rounded-full" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              subject.trend === "up"
                                ? "text-green-600"
                                : subject.trend === "down"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {subject.trend === "up" ? "+" : subject.trend === "down" ? "-" : ""}
                            {subject.trendValue.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Pass %</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${subject.averagePassPercentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {subject.averagePassPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Marks</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {subject.averageMarks.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Performers */}
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
              <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Performers
                </h2>
              </div>

              {topPerformers.length === 0 ? (
                <div className="p-8 text-center">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No performance data available</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-dark-700">
                  {topPerformers.map((performer, index) => (
                    <div key={performer.studentId} className="p-4 flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : index === 2
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {performer.studentName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {performer.admissionNumber} • {performer.totalExams} exams
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {performer.averageMarks.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Avg Marks</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          {overallStats && (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Key Insights
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overallStats.topPerformingSubject && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-300">
                          Top Performing Subject
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-400">
                          {overallStats.topPerformingSubject} has the highest pass rate among your subjects.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {overallStats.needsImprovementSubject && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                          Needs Improvement
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-400">
                          {overallStats.needsImprovementSubject} has the lowest pass rate. Consider additional support.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
