"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { ArrowLeft, Save, Eye } from "lucide-react";

interface HallTicket {
  id: string;
  hallTicketNumber: string;
  examCenter: string;
  roomNumber: string;
  seatNumber: string;
  reportingTime: string;
  instructions: string;
  student: {
    fullName: string;
    admissionNumber: string;
    rollNumber: string;
    profilePhoto: string;
    academicUnit: {
      name: string;
    };
  };
  exam: {
    name: string;
    code: string;
    startDate: string;
    endDate: string;
  };
}

export default function EditHallTicketPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const hallTicketId = params.hallTicketId as string;

  const [hallTicket, setHallTicket] = useState<HallTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    examCenter: "",
    roomNumber: "",
    seatNumber: "",
    reportingTime: "",
    instructions: "",
  });

  useEffect(() => {
    fetchHallTicket();
  }, [hallTicketId]);

  const fetchHallTicket = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/hall-tickets/${hallTicketId}`);
      const data = await res.json();

      if (data.success) {
        setHallTicket(data.data);
        setFormData({
          examCenter: data.data.examCenter || "",
          roomNumber: data.data.roomNumber || "",
          seatNumber: data.data.seatNumber || "",
          reportingTime: data.data.reportingTime
            ? new Date(data.data.reportingTime).toISOString().slice(0, 16)
            : "",
          instructions: data.data.instructions || "",
        });
      }
    } catch (error) {
      console.error("Error fetching hall ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/exams/${examId}/hall-tickets/${hallTicketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert("Hall ticket updated successfully");
        router.back();
      } else {
        alert(data.error || "Failed to update hall ticket");
      }
    } catch (error) {
      console.error("Error updating hall ticket:", error);
      alert("Failed to update hall ticket");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    window.open(`/api/student/hall-tickets/${hallTicketId}/download`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="p-6 lg:p-8 flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-3 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!hallTicket) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="p-6 lg:p-8">
            <p className="text-red-600">Hall ticket not found</p>
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
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Edit Admit Card
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update admit card information for {hallTicket.student.fullName}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Information Card */}
            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Student Information
              </h3>

              <div className="flex flex-col items-center mb-4">
                {hallTicket.student.profilePhoto ? (
                  <img
                    src={hallTicket.student.profilePhoto}
                    alt={hallTicket.student.fullName}
                    className="w-32 h-32 rounded-lg object-cover border-2 border-primary mb-3"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-200 dark:bg-dark-700 flex items-center justify-center mb-3">
                    <span className="text-gray-400">No Photo</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {hallTicket.student.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Admission No.</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {hallTicket.student.admissionNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Roll No.</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {hallTicket.student.rollNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Class</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {hallTicket.student.academicUnit.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hall Ticket No.</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {hallTicket.hallTicketNumber}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Exam Details
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Exam Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {hallTicket.exam.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Exam Period</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(hallTicket.exam.startDate).toLocaleDateString()} -{" "}
                      {new Date(hallTicket.exam.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Admit Card Details
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Center *
                    </label>
                    <input
                      type="text"
                      value={formData.examCenter}
                      onChange={(e) =>
                        setFormData({ ...formData, examCenter: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                      placeholder="e.g., Main Campus"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Room Number
                      </label>
                      <input
                        type="text"
                        value={formData.roomNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, roomNumber: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                        placeholder="e.g., Room 101"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Seat Number *
                      </label>
                      <input
                        type="text"
                        value={formData.seatNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, seatNumber: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                        placeholder="e.g., S-001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reporting Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.reportingTime}
                      onChange={(e) =>
                        setFormData({ ...formData, reportingTime: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) =>
                        setFormData({ ...formData, instructions: e.target.value })
                      }
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                      placeholder="Enter any special instructions for the student..."
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      These instructions will appear on the admit card
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={handlePreview}
                    className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Admit Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
