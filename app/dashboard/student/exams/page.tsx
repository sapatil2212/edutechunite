"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Calendar, Clock, FileText, Download, BookOpen, Award, AlertCircle } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  code: string;
  examType: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface ExamSchedule {
  id: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room: string;
  center: string;
  subject: {
    name: string;
    code: string;
  };
  exam: {
    name: string;
    code: string;
  };
}

interface HallTicket {
  id: string;
  hallTicketNumber: string;
  examCenter: string;
  roomNumber: string;
  seatNumber: string;
  reportingTime: string;
  exam: {
    name: string;
    code: string;
    startDate: string;
    endDate: string;
  };
}

interface ExamResult {
  id: string;
  marksObtained: number;
  percentage: number;
  grade: string;
  isPassed: boolean;
  subject: {
    name: string;
    code: string;
  };
  examSchedule: {
    maxMarks: number;
    exam: {
      name: string;
    };
  };
}

export default function StudentExamsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [exams, setExams] = useState<Exam[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [hallTickets, setHallTickets] = useState<HallTicket[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const [examsRes, schedulesRes, hallTicketsRes, resultsRes] = await Promise.all([
        fetch("/api/student/exams"),
        fetch("/api/student/exam-schedules"),
        fetch("/api/student/hall-tickets"),
        fetch("/api/student/exam-results"),
      ]);

      const [examsData, schedulesData, hallTicketsData, resultsData] = await Promise.all([
        examsRes.json(),
        schedulesRes.json(),
        hallTicketsRes.json(),
        resultsRes.json(),
      ]);

      if (examsData.success) setExams(examsData.data || []);
      if (schedulesData.success) setSchedules(schedulesData.data || []);
      if (hallTicketsData.success) setHallTickets(hallTicketsData.data || []);
      if (resultsData.success) setResults(resultsData.data || []);
    } catch (error) {
      console.error("Error fetching exam data:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadHallTicket = async (hallTicketId: string) => {
    try {
      const res = await fetch(`/api/student/hall-tickets/${hallTicketId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hall-ticket-${hallTicketId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading hall ticket:", error);
      alert("Failed to download hall ticket");
    }
  };

  const upcomingExams = exams.filter((exam) => 
    exam.status === "SCHEDULED" || exam.status === "ONGOING"
  );

  const completedExams = exams.filter((exam) => 
    exam.status === "COMPLETED" || exam.status === "RESULTS_PUBLISHED"
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              My Exams
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View your exam schedules, hall tickets, and results
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-dark-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "upcoming"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Upcoming Exams
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "schedule"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Exam Schedule
              </button>
              <button
                onClick={() => setActiveTab("halltickets")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "halltickets"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Hall Tickets
              </button>
              <button
                onClick={() => setActiveTab("results")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "results"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Results
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading exam information...</p>
            </div>
          ) : (
            <>
              {/* Upcoming Exams Tab */}
              {activeTab === "upcoming" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingExams.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-dark-800 rounded-lg p-8 text-center border border-gray-200 dark:border-dark-700">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No upcoming exams</p>
                    </div>
                  ) : (
                    upcomingExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {exam.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {exam.code}
                            </p>
                          </div>
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            {exam.examType.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              {new Date(exam.startDate).toLocaleDateString()} -{" "}
                              {new Date(exam.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                exam.status === "SCHEDULED"
                                  ? "bg-green-500"
                                  : exam.status === "ONGOING"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            <span className="text-gray-600 dark:text-gray-400">
                              {exam.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                          <button
                            onClick={() => router.push(`/dashboard/student/exams/${exam.id}`)}
                            className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-dark-900 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Exam Schedule Tab */}
              {activeTab === "schedule" && (
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                  {schedules.length === 0 ? (
                    <div className="p-8 text-center">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No exam schedules available</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-dark-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Venue
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                          {schedules.map((schedule) => (
                            <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {new Date(schedule.examDate).toLocaleDateString()}
                                  </span>
                                </div>
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
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {schedule.startTime} - {schedule.endTime}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {schedule.room && <div>Room: {schedule.room}</div>}
                                  {schedule.center && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {schedule.center}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Hall Tickets Tab */}
              {activeTab === "halltickets" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {hallTickets.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-dark-800 rounded-lg p-8 text-center border border-gray-200 dark:border-dark-700">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No hall tickets available</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Hall tickets will be available closer to the exam date
                      </p>
                    </div>
                  ) : (
                    hallTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {ticket.exam.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Hall Ticket: {ticket.hallTicketNumber}
                            </p>
                          </div>
                          <FileText className="w-8 h-8 text-primary" />
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Exam Center:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {ticket.examCenter}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Room:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {ticket.roomNumber}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Seat:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {ticket.seatNumber}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Reporting Time:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {new Date(ticket.reportingTime).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => downloadHallTicket(ticket.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download Hall Ticket
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Results Tab */}
              {activeTab === "results" && (
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                  {results.length === 0 ? (
                    <div className="p-8 text-center">
                      <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No results available yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-dark-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Marks Obtained
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Percentage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Grade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                          {results.map((result) => (
                            <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {result.subject.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {result.subject.code}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {result.marksObtained} / {result.examSchedule.maxMarks}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {result.percentage.toFixed(2)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                  {result.grade}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    result.isPassed
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                  }`}
                                >
                                  {result.isPassed ? "Passed" : "Failed"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
