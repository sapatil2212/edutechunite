"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Plus,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Send,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  CreditCard,
  Loader2,
} from "lucide-react";

interface Timetable {
  id: string;
  examName: string;
  startDate: string;
  endDate: string;
  status: string;
  academicYear: { id: string; name: string };
  academicUnit: { id: string; name: string };
  creator: { fullName: string };
  publishedAt: string | null;
  className?: string;
  sectionName?: string;
  _count: {
    slots: number;
    admitCards: number;
  };
}

export default function ExamTimetableListPage() {
  const router = useRouter();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "class" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [generatingAdmitCards, setGeneratingAdmitCards] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Get unique academic years and classes for filters
  const academicYears = Array.from(new Set(timetables.map(t => JSON.stringify({ id: t.academicYear.id, name: t.academicYear.name }))))
    .map(s => JSON.parse(s));
  const classes = Array.from(new Set(timetables.map(t => JSON.stringify({ id: t.academicUnit.id, name: t.academicUnit.name }))))
    .map(s => JSON.parse(s));

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/exams/timetable");
      const data = await res.json();

      if (data.success) {
        setTimetables(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort timetables
  const filteredTimetables = timetables
    .filter((t) => {
      // Status filter
      if (filter !== "all" && t.status !== filter.toUpperCase()) return false;
      // Academic year filter
      if (academicYearFilter && t.academicYear.id !== academicYearFilter) return false;
      // Class filter
      if (classFilter && t.academicUnit.id !== classFilter) return false;
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          t.examName.toLowerCase().includes(query) ||
          t.academicUnit.name.toLowerCase().includes(query) ||
          t.academicYear.name.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case "name":
          comparison = a.examName.localeCompare(b.examName);
          break;
        case "class":
          comparison = a.academicUnit.name.localeCompare(b.academicUnit.name);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handlePublish = async (timetableId: string) => {
    if (!confirm("Publish this timetable? Students and teachers will be notified.")) {
      return;
    }

    try {
      const res = await fetch(`/api/exams/timetable/${timetableId}/publish`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage("Timetable published successfully! Notifications sent.");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchTimetables();
      } else {
        setError(data.error || "Failed to publish timetable");
        setTimeout(() => setError(""), 5000);
      }
    } catch (error) {
      console.error("Error publishing timetable:", error);
      setError("Failed to publish timetable");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleGenerateAdmitCards = async (timetableId: string) => {
    try {
      setGeneratingAdmitCards(timetableId);
      setActionMenuOpen(null);
      
      const res = await fetch(`/api/exams/timetable/${timetableId}/admit-cards`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`${data.count || 0} admit cards generated successfully!`);
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchTimetables();
      } else {
        setError(data.error || "Failed to generate admit cards");
        setTimeout(() => setError(""), 5000);
      }
    } catch (error) {
      console.error("Error generating admit cards:", error);
      setError("Failed to generate admit cards");
      setTimeout(() => setError(""), 5000);
    } finally {
      setGeneratingAdmitCards(null);
    }
  };

  const toggleSort = (field: "date" | "name" | "class" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setFilter("all");
    setAcademicYearFilter("");
    setClassFilter("");
    setSearchQuery("");
  };

  const handleDelete = async (timetableId: string, examName: string) => {
    if (!confirm(`Delete timetable "${examName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/exams/timetable/${timetableId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage("Timetable deleted successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchTimetables();
      } else {
        setError(data.error || "Failed to delete timetable");
        setTimeout(() => setError(""), 5000);
      }
    } catch (error) {
      console.error("Error deleting timetable:", error);
      setError("Failed to delete timetable");
      setTimeout(() => setError(""), 5000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "PUBLISHED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "ONGOING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const hasActiveFilters = filter !== "all" || academicYearFilter || classFilter || searchQuery;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 right-6 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 right-6 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
                <button onClick={() => setError("")} className="ml-2">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Exam Timetables
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage exam schedules, timetables, and admit cards
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard/exams/timetable/create")}>
              <Plus className="w-4 h-4" />
              Create Timetable
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{timetables.length}</p>
                  <p className="text-xs text-gray-500">Total Timetables</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {timetables.filter(t => t.status === "DRAFT").length}
                  </p>
                  <p className="text-xs text-gray-500">Drafts</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {timetables.filter(t => t.status === "PUBLISHED").length}
                  </p>
                  <p className="text-xs text-gray-500">Published</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {timetables.reduce((sum, t) => sum + t._count.admitCards, 0)}
                  </p>
                  <p className="text-xs text-gray-500">Admit Cards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exams..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                {["all", "draft", "published", "completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      filter === status
                        ? "bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Academic Year Filter */}
              <select
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
              >
                <option value="">All Years</option>
                {academicYears.map((year: { id: string; name: string }) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
              >
                <option value="">All Classes</option>
                {classes.map((cls: { id: string; name: string }) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Timetables Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading timetables...</p>
            </div>
          ) : filteredTimetables.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-12 text-center border border-gray-200 dark:border-dark-700">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {hasActiveFilters ? "No timetables match your filters" : "No timetables found"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                {hasActiveFilters ? "Try adjusting your filters" : "Create your first exam timetable to get started"}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => router.push("/dashboard/exams/timetable/create")}>
                  <Plus className="w-4 h-4" />
                  Create Timetable
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                      <th className="text-left px-4 py-3">
                        <button
                          onClick={() => toggleSort("name")}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white"
                        >
                          Exam Name
                          {sortBy === "name" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button
                          onClick={() => toggleSort("class")}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white"
                        >
                          Class
                          {sortBy === "class" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button
                          onClick={() => toggleSort("date")}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white"
                        >
                          Date Range
                          {sortBy === "date" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Slots
                        </span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Admit Cards
                        </span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button
                          onClick={() => toggleSort("status")}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white"
                        >
                          Status
                          {sortBy === "status" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </button>
                      </th>
                      <th className="text-right px-4 py-3">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                    {filteredTimetables.map((timetable) => (
                      <tr
                        key={timetable.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {timetable.examName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {timetable.academicYear.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {timetable.academicUnit.name}
                            </p>
                            {timetable.sectionName && (
                              <p className="text-xs text-gray-500">{timetable.sectionName}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {new Date(timetable.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {" - "}
                              {new Date(timetable.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                            <FileText className="w-3 h-3" />
                            {timetable._count.slots}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded text-xs font-medium">
                            <CreditCard className="w-3 h-3" />
                            {timetable._count.admitCards}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(timetable.status)}`}>
                            {timetable.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => router.push(`/dashboard/exams/timetable/${timetable.id}`)}
                              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => router.push(`/dashboard/exams/timetable/${timetable.id}/edit`)}
                              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* More Actions Menu */}
                            <div className="relative" style={{ position: 'static' }}>
                              <button
                                id={`action-btn-${timetable.id}`}
                                onClick={() => setActionMenuOpen(actionMenuOpen === timetable.id ? null : timetable.id)}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredTimetables.length} of {timetables.length} timetables
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenuOpen(null)}
        />
      )}

      {/* Action Menu Portal - rendered outside table to prevent clipping */}
      <AnimatePresence>
        {actionMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-200 dark:border-dark-600 py-1"
            style={{
              top: (() => {
                const btn = document.getElementById(`action-btn-${actionMenuOpen}`);
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  const menuHeight = 150;
                  if (rect.top > menuHeight + 10) {
                    return rect.top - menuHeight - 5;
                  }
                  return rect.bottom + 5;
                }
                return 100;
              })(),
              left: (() => {
                const btn = document.getElementById(`action-btn-${actionMenuOpen}`);
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  return Math.max(10, rect.right - 192);
                }
                return 100;
              })(),
            }}
          >
            {(() => {
              const timetable = timetables.find(t => t.id === actionMenuOpen);
              if (!timetable) return null;
              return (
                <>
                  {timetable.status === "DRAFT" && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(null);
                        handlePublish(timetable.id);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                    >
                      <Send className="w-4 h-4 text-green-600" />
                      Publish & Notify
                    </button>
                  )}

                  {timetable.status === "PUBLISHED" && (
                    <button
                      onClick={() => handleGenerateAdmitCards(timetable.id)}
                      disabled={generatingAdmitCards === timetable.id}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50"
                    >
                      {generatingAdmitCards === timetable.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-purple-600" />
                      )}
                      Generate Admit Cards
                    </button>
                  )}

                  {timetable._count.admitCards > 0 && (
                    <button
                      onClick={() => {
                        setActionMenuOpen(null);
                        router.push(`/dashboard/exams/timetable/${timetable.id}/admit-cards`);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                      View Admit Cards
                    </button>
                  )}

                  <div className="border-t border-gray-200 dark:border-dark-600 my-1" />

                  <button
                    onClick={() => {
                      setActionMenuOpen(null);
                      handleDelete(timetable.id, timetable.examName);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
