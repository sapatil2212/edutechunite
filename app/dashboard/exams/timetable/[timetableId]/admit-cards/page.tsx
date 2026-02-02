"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Printer,
  Search,
  CreditCard,
  User,
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  GraduationCap,
  Phone,
  Mail,
  Building,
} from "lucide-react";

interface AdmitCard {
  id: string;
  hallTicketNo: string;
  seatNumber: string;
  examCenter: string;
  roomNumber: string;
  reportingTime: string;
  instructions: string;
  generatedAt: string;
  student: {
    id: string;
    rollNumber: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      avatar: string | null;
    };
    academicUnit: {
      name: string;
    };
  };
  timetable: {
    examName: string;
    startDate: string;
    endDate: string;
    academicUnit: {
      name: string;
    };
    academicYear: {
      name: string;
    };
  };
}

interface ExamSlot {
  date: string;
  subject: string;
  subjectCode: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  room: string;
}

export default function AdmitCardsPage() {
  const router = useRouter();
  const params = useParams();
  const timetableId = params.timetableId as string;

  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<AdmitCard | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAdmitCards();
  }, [timetableId]);

  const fetchAdmitCards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/timetable/${timetableId}/admit-cards`);
      const data = await res.json();

      if (data.success) {
        setAdmitCards(data.data || []);
      } else {
        setError(data.error || "Failed to fetch admit cards");
      }
    } catch (error) {
      console.error("Error fetching admit cards:", error);
      setError("Failed to fetch admit cards");
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = admitCards.filter((card) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      card.student.user.fullName.toLowerCase().includes(query) ||
      card.hallTicketNo.toLowerCase().includes(query) ||
      card.seatNumber.toLowerCase().includes(query) ||
      card.student.rollNumber?.toLowerCase().includes(query)
    );
  });

  const parseExamSchedule = (instructions: string): ExamSlot[] => {
    try {
      const lines = instructions.split("\n").filter(line => line.includes(" - "));
      return lines.map(line => {
        const [datePart, rest] = line.split(" - ");
        const match = rest?.match(/(.+?)\s*\((.+?)\s*-\s*(.+?)\)/);
        return {
          date: datePart || "",
          subject: match?.[1]?.trim() || rest || "",
          subjectCode: "",
          startTime: match?.[2]?.trim() || "",
          endTime: match?.[3]?.trim() || "",
          maxMarks: 100,
          room: "TBA",
        };
      });
    } catch {
      return [];
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Admit Card - ${selectedCard?.student.user.fullName}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
              .admit-card { max-width: 800px; margin: 0 auto; border: 3px solid #1a365d; padding: 0; }
              .header { background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); color: white; padding: 20px; text-align: center; }
              .header h1 { font-size: 24px; margin-bottom: 5px; }
              .header p { font-size: 14px; opacity: 0.9; }
              .exam-title { background: #f0f4f8; padding: 15px; text-align: center; border-bottom: 2px solid #e2e8f0; }
              .exam-title h2 { color: #1a365d; font-size: 20px; }
              .content { padding: 20px; }
              .student-info { display: flex; gap: 20px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
              .photo-placeholder { width: 120px; height: 150px; border: 2px dashed #cbd5e0; display: flex; align-items: center; justify-content: center; background: #f7fafc; color: #a0aec0; font-size: 12px; }
              .details { flex: 1; }
              .detail-row { display: flex; margin-bottom: 10px; }
              .detail-label { width: 140px; font-weight: 600; color: #4a5568; }
              .detail-value { flex: 1; color: #1a202c; }
              .schedule-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .schedule-table th { background: #1a365d; color: white; padding: 12px; text-align: left; font-size: 12px; }
              .schedule-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
              .schedule-table tr:nth-child(even) { background: #f7fafc; }
              .instructions { background: #fffbeb; border: 1px solid #f6e05e; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .instructions h4 { color: #744210; margin-bottom: 10px; }
              .instructions ul { margin-left: 20px; color: #744210; font-size: 13px; }
              .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
              .signature-box { text-align: center; width: 200px; }
              .signature-line { border-top: 1px solid #1a202c; margin-top: 50px; padding-top: 5px; font-size: 12px; }
              @media print { body { padding: 0; } .admit-card { border: 2px solid #000; } }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const getExamScheduleFromCard = (card: AdmitCard): ExamSlot[] => {
    return parseExamSchedule(card.instructions);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
                <button onClick={() => setError("")} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push("/dashboard/exams/timetable")}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admit Cards
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {admitCards.length} admit cards generated
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, hall ticket, or seat number..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
              />
            </div>
          </div>

          {/* Admit Cards Grid */}
          {filteredCards.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-12 text-center border border-gray-200 dark:border-dark-700">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchQuery ? "No admit cards match your search" : "No admit cards generated yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedCard(card)}
                >
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs opacity-80">Hall Ticket No.</p>
                        <p className="font-bold text-lg">{card.hallTicketNo}</p>
                      </div>
                      <CreditCard className="w-8 h-8 opacity-50" />
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                        {card.student.user.avatar ? (
                          <img
                            src={card.student.user.avatar}
                            alt={card.student.user.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {card.student.user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {card.student.academicUnit.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>Seat: {card.seatNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{card.timetable.examName}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-600 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Generated {new Date(card.generatedAt).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3" />
                        View
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Admit Card Preview Modal */}
      <AnimatePresence>
        {selectedCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCard(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-10 z-50 overflow-auto"
            >
              <div className="min-h-full flex items-start justify-center py-8">
                <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Admit Card Preview</h2>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4" />
                        Print
                      </Button>
                      <button
                        onClick={() => setSelectedCard(null)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Printable Admit Card */}
                  <div ref={printRef} className="p-6">
                    <div className="admit-card border-4 border-blue-900 rounded-lg overflow-hidden">
                      {/* Header */}
                      <div className="header bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <Building className="w-8 h-8" />
                          <h1 className="text-2xl font-bold">{selectedCard.examCenter}</h1>
                        </div>
                        <p className="text-sm opacity-90">Examination Admit Card</p>
                      </div>

                      {/* Exam Title */}
                      <div className="exam-title bg-blue-50 p-4 text-center border-b-2 border-blue-200">
                        <h2 className="text-xl font-bold text-blue-900">
                          {selectedCard.timetable.examName}
                        </h2>
                        <p className="text-sm text-blue-700">
                          {selectedCard.timetable.academicYear.name}
                        </p>
                      </div>

                      {/* Content */}
                      <div className="content p-6">
                        {/* Student Info */}
                        <div className="student-info flex gap-6 mb-6 pb-6 border-b border-gray-200">
                          <div className="photo-placeholder w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                            {selectedCard.student.user.avatar ? (
                              <img
                                src={selectedCard.student.user.avatar}
                                alt={selectedCard.student.user.fullName}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-center text-gray-400">
                                <User className="w-12 h-12 mx-auto mb-1" />
                                <span className="text-xs">Photo</span>
                              </div>
                            )}
                          </div>

                          <div className="details flex-1 space-y-3">
                            <div className="detail-row flex">
                              <span className="detail-label w-36 font-semibold text-gray-600">Student Name:</span>
                              <span className="detail-value font-bold text-gray-900">{selectedCard.student.user.fullName}</span>
                            </div>
                            <div className="detail-row flex">
                              <span className="detail-label w-36 font-semibold text-gray-600">Hall Ticket No:</span>
                              <span className="detail-value font-bold text-blue-700">{selectedCard.hallTicketNo}</span>
                            </div>
                            <div className="detail-row flex">
                              <span className="detail-label w-36 font-semibold text-gray-600">Class:</span>
                              <span className="detail-value text-gray-900">{selectedCard.timetable.academicUnit.name}</span>
                            </div>
                            <div className="detail-row flex">
                              <span className="detail-label w-36 font-semibold text-gray-600">Seat Number:</span>
                              <span className="detail-value font-bold text-green-700">{selectedCard.seatNumber}</span>
                            </div>
                            <div className="detail-row flex">
                              <span className="detail-label w-36 font-semibold text-gray-600">Exam Center:</span>
                              <span className="detail-value text-gray-900">{selectedCard.examCenter}</span>
                            </div>
                            <div className="detail-row flex">
                              <span className="detail-label w-36 font-semibold text-gray-600">Reporting Time:</span>
                              <span className="detail-value text-gray-900">{selectedCard.reportingTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Exam Schedule Table */}
                        <div className="mb-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Examination Schedule
                          </h3>
                          <table className="schedule-table w-full border-collapse">
                            <thead>
                              <tr className="bg-blue-900 text-white">
                                <th className="p-3 text-left text-sm">Date</th>
                                <th className="p-3 text-left text-sm">Subject</th>
                                <th className="p-3 text-left text-sm">Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getExamScheduleFromCard(selectedCard).map((slot, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                  <td className="p-3 text-sm">{slot.date}</td>
                                  <td className="p-3 text-sm font-medium">{slot.subject}</td>
                                  <td className="p-3 text-sm">{slot.startTime} - {slot.endTime}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Instructions */}
                        <div className="instructions bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                          <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Important Instructions
                          </h4>
                          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                            <li>Bring this admit card to the examination hall</li>
                            <li>Carry a valid photo ID proof</li>
                            <li>Report at least 30 minutes before the exam</li>
                            <li>Electronic devices are not allowed</li>
                            <li>Follow all examination rules and regulations</li>
                          </ul>
                        </div>

                        {/* Signatures */}
                        <div className="signatures flex justify-between mt-8 pt-6">
                          <div className="signature-box text-center">
                            <div className="h-16 border-b border-gray-400 mb-2"></div>
                            <p className="text-sm font-medium text-gray-600">Class Teacher</p>
                          </div>
                          <div className="signature-box text-center">
                            <div className="h-16 border-b border-gray-400 mb-2"></div>
                            <p className="text-sm font-medium text-gray-600">Principal</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
