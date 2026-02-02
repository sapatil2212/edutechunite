"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { 
  Calendar, 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp,
  Bell,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  attendance: {
    present: number;
    total: number;
    percentage: number;
  };
  upcomingExams: number;
  pendingAssignments: number;
  recentNotices: number;
}

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call
      // For now, using mock data
      setStats({
        attendance: {
          present: 85,
          total: 100,
          percentage: 85,
        },
        upcomingExams: 3,
        pendingAssignments: 5,
        recentNotices: 8,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {session?.user?.name || "Student"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your academics today.
            </p>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Attendance Card */}
                <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.attendance.percentage}%
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Attendance
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {stats?.attendance.present} / {stats?.attendance.total} days
                  </p>
                </div>

                {/* Upcoming Exams Card */}
                <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.upcomingExams}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Upcoming Exams
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    In the next 30 days
                  </p>
                </div>

                {/* Pending Assignments Card */}
                <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.pendingAssignments}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Pending Assignments
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Due this week
                  </p>
                </div>

                {/* Notices Card */}
                <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.recentNotices}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    New Notices
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    This week
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Schedule */}
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Today's Schedule
                    </h2>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div className="w-1 h-12 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Mathematics
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          09:00 AM - 10:00 AM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div className="w-1 h-12 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Science
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          10:00 AM - 11:00 AM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div className="w-1 h-12 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          English
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          11:30 AM - 12:30 PM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Notices */}
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Notices
                    </h2>
                    <Bell className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Mid-term Exam Schedule Released
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        2 hours ago
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 rounded">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Assignment Deadline Extended
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        1 day ago
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 rounded">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Sports Day Registration Open
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        2 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
