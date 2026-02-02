"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { 
  FileText, Calendar, Clock, AlertCircle, CheckCircle, 
  User, BookOpen, Paperclip, Download, XCircle
} from "lucide-react";
import { format } from "date-fns";

interface Homework {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  assignedDate: string;
  dueDate: string;
  maxMarks: number | null;
  allowLateSubmission: boolean;
  requiresSubmission: boolean;
  attachments: any;
  subject: {
    id: string;
    name: string;
    code: string;
    color: string | null;
  };
  teacher: {
    id: string;
    fullName: string;
  } | null;
  submissions: Array<{
    id: string;
    status: string;
    submittedAt: string | null;
    marksObtained: number | null;
    feedback: string | null;
  }>;
}

interface HomeworkData {
  all: Homework[];
  pending: Homework[];
  overdue: Homework[];
  submitted: Homework[];
  stats: {
    total: number;
    pending: number;
    overdue: number;
    submitted: number;
  };
}

export default function StudentHomeworkPage() {
  const [data, setData] = useState<HomeworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "overdue" | "submitted">("all");

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/student/homework");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch homework");
      }

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching homework:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch homework");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy, hh:mm a");
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (homework: Homework) => {
    if (homework.submissions.length > 0) {
      const submission = homework.submissions[0];
      if (submission.marksObtained !== null) {
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Graded: {submission.marksObtained}/{homework.maxMarks}
          </span>
        );
      }
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          Submitted
        </span>
      );
    }

    const daysUntilDue = getDaysUntilDue(homework.dueDate);
    if (daysUntilDue < 0) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          Overdue
        </span>
      );
    } else if (daysUntilDue === 0) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
          Due Today
        </span>
      );
    } else if (daysUntilDue <= 2) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          Due in {daysUntilDue} day{daysUntilDue !== 1 ? "s" : ""}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
        Due in {daysUntilDue} days
      </span>
    );
  };

  const getHomeworkList = () => {
    if (!data) return [];
    switch (activeTab) {
      case "pending":
        return data.pending;
      case "overdue":
        return data.overdue;
      case "submitted":
        return data.submitted;
      default:
        return data.all;
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
              Homework & Assignments
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and submit your homework assigned by teachers
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading homework...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : !data ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No homework data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.stats.total}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {data.stats.pending}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {data.stats.overdue}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {data.stats.submitted}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                <div className="border-b border-gray-200 dark:border-dark-700">
                  <div className="flex gap-4 px-6">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "all"
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      All ({data.stats.total})
                    </button>
                    <button
                      onClick={() => setActiveTab("pending")}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "pending"
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Pending ({data.stats.pending})
                    </button>
                    <button
                      onClick={() => setActiveTab("overdue")}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "overdue"
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Overdue ({data.stats.overdue})
                    </button>
                    <button
                      onClick={() => setActiveTab("submitted")}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "submitted"
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Submitted ({data.stats.submitted})
                    </button>
                  </div>
                </div>

                {/* Homework List */}
                <div className="p-6">
                  {getHomeworkList().length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No homework in this category
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getHomeworkList().map((homework) => (
                        <div
                          key={homework.id}
                          className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className="w-1 h-12 rounded-full"
                                  style={{ backgroundColor: homework.subject.color || "#3B82F6" }}
                                />
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {homework.title}
                                  </h3>
                                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="w-4 h-4" />
                                      {homework.subject.name}
                                    </span>
                                    {homework.teacher && (
                                      <span className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {homework.teacher.fullName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(homework)}
                          </div>

                          {homework.description && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              {homework.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Assigned: {formatDate(homework.assignedDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Due: {formatDate(homework.dueDate)}
                            </span>
                            {homework.maxMarks && (
                              <span>Max Marks: {homework.maxMarks}</span>
                            )}
                          </div>

                          {homework.attachments && Array.isArray(homework.attachments) && homework.attachments.length > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                              <Paperclip className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {homework.attachments.length} attachment{homework.attachments.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}

                          {homework.submissions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-600">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Submitted on {formatDateTime(homework.submissions[0].submittedAt!)}
                                  </p>
                                  {homework.submissions[0].feedback && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      Feedback: {homework.submissions[0].feedback}
                                    </p>
                                  )}
                                </div>
                                {homework.submissions[0].marksObtained !== null && (
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                      {homework.submissions[0].marksObtained}/{homework.maxMarks}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
