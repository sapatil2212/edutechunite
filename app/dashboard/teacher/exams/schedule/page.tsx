"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Calendar, Clock, Plus, Edit, Trash2, Eye, Users } from "lucide-react";

interface ExamSchedule {
  id: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  room: string;
  center: string;
  maxMarks: number;
  passingMarks: number;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  academicUnit: {
    id: string;
    name: string;
  };
  exam: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  marksEntryStatus: string;
  _count?: {
    results: number;
  };
}

export default function TeacherExamSchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/exam-schedules");
      const data = await res.json();

      if (data.success) {
        setSchedules(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    if (filter === "all") return true;
    if (filter === "upcoming") {
      return new Date(schedule.examDate) >= new Date();
    }
    if (filter === "completed") {
      return new Date(schedule.examDate) < new Date();
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "ONGOING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getMarksEntryStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "LOCKED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Exam Schedule
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and manage exam schedules for your subjects
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
              All Schedules
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "upcoming"
                  ? "bg-primary text-dark-900"
                  : "bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-700"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "completed"
                  ? "bg-primary text-dark-900"
                  : "bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-700"
              }`}
            >
              Completed
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading schedules...</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg p-12 text-center border border-gray-200 dark:border-dark-700">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No exam schedules found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Exam schedules will appear here once they are created
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {schedule.subject.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {schedule.exam.name} • {schedule.subject.code}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        schedule.exam.status
                      )}`}
                    >
                      {schedule.exam.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{new Date(schedule.examDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {schedule.startTime} - {schedule.endTime} ({schedule.duration} mins)
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{schedule.academicUnit.name}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Max Marks</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {schedule.maxMarks}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Passing Marks</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {schedule.passingMarks}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Marks Entry Status
                    </p>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getMarksEntryStatusColor(
                        schedule.marksEntryStatus
                      )}`}
                    >
                      {schedule.marksEntryStatus.replace(/_/g, " ")}
                    </span>
                  </div>

                  {schedule.room && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <strong>Room:</strong> {schedule.room}
                      {schedule.center && ` • ${schedule.center}`}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/teacher/exams/marks-entry?scheduleId=${schedule.id}`)
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Enter Marks
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/teacher/exams/schedule/${schedule.id}`)
                      }
                      className="px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
