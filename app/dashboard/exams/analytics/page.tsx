"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { TrendingUp, Users, Award, BarChart3 } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  code: string;
}

interface Analytics {
  totalStudents: number;
  appearedStudents: number;
  absentStudents: number;
  passedStudents: number;
  failedStudents: number;
  highestMarks: number;
  lowestMarks: number;
  averageMarks: number;
  medianMarks: number;
  above90: number;
  between75And90: number;
  between60And75: number;
  between33And60: number;
  below33: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchAnalytics();
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (data.success) {
        setExams(data.data.filter((e: Exam) => e.status === "RESULTS_PUBLISHED"));
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${selectedExam}/analytics`);
      const data = await res.json();
      if (data.success && data.data.overall) {
        setAnalytics(data.data.overall);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const passPercentage = analytics
    ? ((analytics.passedStudents / analytics.appearedStudents) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Exam Analytics
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View detailed performance analytics and insights
            </p>
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
                  {exam.name} ({exam.code})
                </option>
              ))}
            </select>
          </div>

          {selectedExam && (
            <>
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Loading analytics...
                  </p>
                </div>
              ) : analytics ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Total Students
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {analytics.totalStudents}
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
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Pass Rate
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {passPercentage}%
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Average Marks
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {analytics.averageMarks?.toFixed(1) || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Highest Marks
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {analytics.highestMarks || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                          <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Attendance Overview
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Appeared
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.appearedStudents}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Absent
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.absentStudents}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Passed
                          </span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {analytics.passedStudents}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Failed
                          </span>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {analytics.failedStudents}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Statistical Analysis
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Highest Marks
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.highestMarks || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Lowest Marks
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.lowestMarks || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Average Marks
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.averageMarks?.toFixed(2) || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Median Marks
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.medianMarks?.toFixed(2) || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Performance Distribution
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            90% and above (Excellent)
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.above90} students
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.above90 / analytics.totalStudents) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            75% - 90% (Very Good)
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.between75And90} students
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.between75And90 / analytics.totalStudents) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            60% - 75% (Good)
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.between60And75} students
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.between60And75 / analytics.totalStudents) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            33% - 60% (Average)
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.between33And60} students
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.between33And60 / analytics.totalStudents) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Below 33% (Needs Improvement)
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.below33} students
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{
                              width: `${(analytics.below33 / analytics.totalStudents) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No analytics data available for this exam
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
