"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Calendar, Clock, MapPin, Eye } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  code: string;
}

interface Schedule {
  id: string;
  exam: Exam;
  subject: { name: string; code: string };
  academicUnit: { name: string };
  examDate: string;
  startTime: string;
  endTime: string;
  room?: string;
  maxMarks: number;
}

export default function ExamSchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSchedules();
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

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${selectedExam}/schedules`);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Exam Schedule
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage exam schedules
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
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Loading schedules...
                  </p>
                </div>
              ) : schedules.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No schedules found for this exam
                  </p>
                  <button
                    onClick={() => router.push(`/dashboard/exams/${selectedExam}/schedule`)}
                    className="mt-4 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create Schedule
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-dark-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Venue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Max Marks
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                      {schedules.map((schedule) => (
                        <tr
                          key={schedule.id}
                          className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {schedule.academicUnit.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {schedule.subject.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {schedule.subject.code}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(schedule.examDate)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {schedule.room ? (
                              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {schedule.room}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {schedule.maxMarks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => router.push(`/dashboard/exams/${selectedExam}/schedule`)}
                              className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
