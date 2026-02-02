"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { FileText, Download, Eye, Plus } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  code: string;
}

interface ReportCard {
  id: string;
  title: string;
  reportPeriod: string;
  reportCardType: string;
  status: string;
  generatedAt: string;
  downloadCount: number;
}

export default function ReportCardsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchReportCards();
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

  const fetchReportCards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${selectedExam}/report-cards`);
      const data = await res.json();
      if (data.success) {
        setReportCards(data.data);
      }
    } catch (error) {
      console.error("Error fetching report cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportCards = async () => {
    if (!selectedExam) return;

    if (!confirm("Generate report cards for all students in this exam?")) {
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`/api/exams/${selectedExam}/report-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportCardType: "EXAM_WISE",
          includeAttendance: true,
          includeRemarks: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`${data.data.length} report cards generated successfully!`);
        fetchReportCards();
      } else {
        alert(data.error || "Failed to generate report cards");
      }
    } catch (error) {
      console.error("Error generating report cards:", error);
      alert("Failed to generate report cards");
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: "bg-gray-100", text: "text-gray-800" },
      GENERATED: { bg: "bg-blue-100", text: "text-blue-800" },
      PUBLISHED: { bg: "bg-green-100", text: "text-green-800" },
      ARCHIVED: { bg: "bg-gray-100", text: "text-gray-600" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {status}
      </span>
    );
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
                Report Cards
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate and manage student report cards
              </p>
            </div>
            {selectedExam && (
              <button
                onClick={handleGenerateReportCards}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                {generating ? "Generating..." : "Generate Report Cards"}
              </button>
            )}
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
                    Loading report cards...
                  </p>
                </div>
              ) : reportCards.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No report cards generated yet
                  </p>
                  <button
                    onClick={handleGenerateReportCards}
                    disabled={generating}
                    className="px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Generate Report Cards
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-dark-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Generated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Downloads
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
                      {reportCards.map((card) => (
                        <tr
                          key={card.id}
                          className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {card.title}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {card.reportCardType.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {card.reportPeriod}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(card.generatedAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {card.downloadCount}
                            </span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(card.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
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
          )}
        </div>
      </main>
    </div>
  );
}
