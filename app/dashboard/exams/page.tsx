"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Award,
  Plus,
  Search,
  Calendar,
  Users,
  Eye,
  Edit,
  CheckCircle,
  Trash2,
} from "lucide-react";

interface Exam {
  id: string;
  name: string;
  code: string;
  examType: string;
  status: string;
  startDate: string;
  endDate: string;
  academicYear: {
    name: string;
  };
  _count?: {
    schedules: number;
    results: number;
  };
}

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [examTypeFilter, setExamTypeFilter] = useState("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || exam.status === statusFilter;
    const matchesType =
      examTypeFilter === "ALL" || exam.examType === examTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

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
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async (examId: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete exam");
        return;
      }

      alert("Exam deleted successfully");
      setDeleteConfirm(null);
      fetchExams();
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Failed to delete exam");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Exam Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create and manage exams, schedules, and results
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/exams/create")}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Exam
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Exams
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {exams.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scheduled
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {exams.filter((e) => e.status === "SCHEDULED").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ongoing
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {exams.filter((e) => e.status === "ONGOING").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Published
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {exams.filter((e) => e.status === "RESULTS_PUBLISHED").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-700 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ONGOING">Ongoing</option>
                <option value="RESULTS_PUBLISHED">Published</option>
              </select>

              <select
                value={examTypeFilter}
                onChange={(e) => setExamTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
              >
                <option value="ALL">All Types</option>
                <option value="UNIT_TEST">Unit Test</option>
                <option value="MID_TERM">Mid-Term</option>
                <option value="FINAL">Final</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Loading exams...
                </p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="p-8 text-center">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No exams found. Create your first exam to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Exam Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {filteredExams.map((exam) => (
                      <tr
                        key={exam.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {exam.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {exam.code} • {exam.academicYear.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {exam.examType.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(exam.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                router.push(`/dashboard/exams/${exam.id}`)
                              }
                              className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                router.push(`/dashboard/exams/${exam.id}/edit`)
                              }
                              className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/exams/${exam.id}/schedule`
                                )
                              }
                              className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                              title="Manage Schedule"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(exam.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                              disabled={exam.status === "RESULTS_PUBLISHED" || exam.status === "MARKS_ENTRY_IN_PROGRESS"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Exam?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this exam? This action cannot be undone.
              All schedules and related data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
