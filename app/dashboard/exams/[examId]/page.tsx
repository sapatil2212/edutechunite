"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  ArrowLeft,
  Edit,
  Calendar,
  Users,
  FileText,
  Award,
  CheckCircle,
  Trash2,
} from "lucide-react";

interface Exam {
  id: string;
  name: string;
  code: string;
  description?: string;
  examType: string;
  status: string;
  startDate: string;
  endDate: string;
  evaluationType: string;
  examMode: string;
  overallPassingPercentage: number;
  subjectWisePassing: boolean;
  showRank: boolean;
  showPercentage: boolean;
  showGrade: boolean;
  weightage: number;
  academicYear: {
    name: string;
  };
  _count?: {
    schedules: number;
    results: number;
  };
}

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}`);
      const data = await res.json();
      if (data.success) {
        setExam(data.data);
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Exam deleted successfully");
        router.push("/dashboard/exams");
      } else {
        alert(data.error || "Failed to delete exam");
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Failed to delete exam");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: "bg-gray-100", text: "text-gray-800" },
      SCHEDULED: { bg: "bg-blue-100", text: "text-blue-800" },
      ONGOING: { bg: "bg-yellow-100", text: "text-yellow-800" },
      COMPLETED: { bg: "bg-green-100", text: "text-green-800" },
      MARKS_ENTRY_IN_PROGRESS: { bg: "bg-purple-100", text: "text-purple-800" },
      RESULTS_PUBLISHED: { bg: "bg-emerald-100", text: "text-emerald-800" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="p-6 lg:p-8">
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Exam not found</p>
              <button
                onClick={() => router.push("/dashboard/exams")}
                className="mt-4 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <button
            onClick={() => router.push("/dashboard/exams")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {exam.name}
                </h1>
                {getStatusBadge(exam.status)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {exam.code} • {exam.academicYear.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/dashboard/exams/${examId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => router.push(`/dashboard/exams/${examId}/schedule`)}
              className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 hover:border-primary transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Schedules
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {exam._count?.schedules || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push(`/dashboard/exams/marks-entry`)}
              className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 hover:border-primary transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Marks Entry
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {exam._count?.results || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push(`/dashboard/exams/results`)}
              className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 hover:border-primary transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Results
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    View Results
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push(`/dashboard/exams/analytics`)}
              className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 hover:border-primary transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analytics
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    View Analytics
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Exam Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Exam Type
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {exam.examType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Start Date
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(exam.startDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    End Date
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(exam.endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Exam Mode
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {exam.examMode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Weightage
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {exam.weightage}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Evaluation Settings
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Evaluation Type
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {exam.evaluationType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Passing Percentage
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {exam.overallPassingPercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Subject-wise Passing
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {exam.subjectWisePassing ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Show Rank
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {exam.showRank ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Show Percentage
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {exam.showPercentage ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {exam.description && (
            <div className="mt-6 bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Description
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {exam.description}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
