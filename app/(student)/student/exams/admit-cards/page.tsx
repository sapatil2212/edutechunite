"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Download,
  Printer,
  Calendar,
  Clock,
  MapPin,
  User,
  Building,
  AlertCircle,
  Loader2,
  X,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface ExamSlot {
  date: string;
  subject: string;
  subjectCode: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  room: string;
}

interface AdmitCard {
  id: string;
  hallTicketNo: string;
  seatNumber: string;
  examCenter: string;
  roomNumber: string;
  reportingTime: string;
  instructions: string;
  generatedAt: string;
  timetable: {
    id: string;
    examName: string;
    startDate: string;
    endDate: string;
    className: string;
    academicYear: string;
    school: {
      name: string;
      address: string;
      phone: string;
      email: string;
    };
  };
  examSchedule: ExamSlot[];
}

export default function StudentAdmitCardsPage() {
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCard, setSelectedCard] = useState<AdmitCard | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAdmitCards();
  }, []);

  const fetchAdmitCards = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/admit-cards");
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

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Admit Card</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
              .admit-card { max-width: 800px; margin: 0 auto; border: 3px solid #1a365d; }
              .header { background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); color: white; padding: 20px; text-align: center; }
              .header h1 { font-size: 24px; margin-bottom: 5px; }
              .header p { font-size: 14px; opacity: 0.9; }
              .exam-title { background: #f0f4f8; padding: 15px; text-align: center; border-bottom: 2px solid #e2e8f0; }
              .exam-title h2 { color: #1a365d; font-size: 20px; }
              .content { padding: 20px; }
              .student-info { display: flex; gap: 20px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
              .photo-placeholder { width: 120px; height: 150px; border: 2px dashed #cbd5e0; display: flex; align-items: center; justify-content: center; background: #f7fafc; }
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          My Admit Cards
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and download your examination admit cards
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Admit Cards */}
      {admitCards.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-xl p-12 text-center border border-gray-200 dark:border-dark-700">
          <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Admit Cards Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Your admit cards will appear here once they are generated for upcoming exams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {admitCards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => setSelectedCard(card)}
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs opacity-80 uppercase tracking-wider">Hall Ticket</p>
                      <p className="font-bold text-2xl">{card.hallTicketNo}</p>
                    </div>
                    <CreditCard className="w-10 h-10 opacity-50" />
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-300" />
                    <span className="text-sm">Valid for Examination</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {card.timetable.examName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {card.timetable.academicYear} • {card.timetable.className}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Seat Number</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{card.seatNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Exam Period</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(card.timetable.startDate).toLocaleDateString()} - {new Date(card.timetable.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Total Exams</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{card.examSchedule.length} Subjects</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-200 dark:border-dark-600 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Generated {new Date(card.generatedAt).toLocaleDateString()}
                  </span>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors group-hover:scale-105">
                    <Download className="w-4 h-4" />
                    View & Print
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
                    <h2 className="text-lg font-semibold text-gray-900">Admit Card</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        Print / Download PDF
                      </button>
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
                          <h1 className="text-2xl font-bold">{selectedCard.timetable.school.name}</h1>
                        </div>
                        {selectedCard.timetable.school.address && (
                          <p className="text-sm opacity-90">{selectedCard.timetable.school.address}</p>
                        )}
                        <p className="text-sm opacity-80 mt-1">
                          {selectedCard.timetable.school.phone && `Phone: ${selectedCard.timetable.school.phone}`}
                          {selectedCard.timetable.school.email && ` | Email: ${selectedCard.timetable.school.email}`}
                        </p>
                      </div>

                      {/* Exam Title */}
                      <div className="exam-title bg-blue-50 p-4 text-center border-b-2 border-blue-200">
                        <h2 className="text-xl font-bold text-blue-900">
                          {selectedCard.timetable.examName}
                        </h2>
                        <p className="text-sm text-blue-700">
                          {selectedCard.timetable.academicYear} • ADMIT CARD
                        </p>
                      </div>

                      {/* Content */}
                      <div className="content p-6">
                        {/* Student Info */}
                        <div className="student-info flex gap-6 mb-6 pb-6 border-b border-gray-200">
                          <div className="photo-placeholder w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                            <div className="text-center text-gray-400">
                              <User className="w-12 h-12 mx-auto mb-1" />
                              <span className="text-xs">Paste Photo</span>
                            </div>
                          </div>

                          <div className="details flex-1 space-y-3">
                            <div className="detail-row flex">
                              <span className="detail-label w-36 font-semibold text-gray-600">Hall Ticket No:</span>
                              <span className="detail-value font-bold text-blue-700 text-lg">{selectedCard.hallTicketNo}</span>
                            </div>
                            <div className="detail-row flex">
                              <span className="detail-label w-36 font-semibold text-gray-600">Class:</span>
                              <span className="detail-value text-gray-900">{selectedCard.timetable.className}</span>
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
                          <table className="schedule-table w-full border-collapse border border-gray-200">
                            <thead>
                              <tr className="bg-blue-900 text-white">
                                <th className="p-3 text-left text-sm border border-blue-800">Date</th>
                                <th className="p-3 text-left text-sm border border-blue-800">Subject</th>
                                <th className="p-3 text-left text-sm border border-blue-800">Time</th>
                                <th className="p-3 text-left text-sm border border-blue-800">Max Marks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedCard.examSchedule.map((slot, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                  <td className="p-3 text-sm border border-gray-200">
                                    {new Date(slot.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                  </td>
                                  <td className="p-3 text-sm font-medium border border-gray-200">
                                    {slot.subject}
                                    {slot.subjectCode && <span className="text-gray-500 ml-1">({slot.subjectCode})</span>}
                                  </td>
                                  <td className="p-3 text-sm border border-gray-200">{slot.startTime} - {slot.endTime}</td>
                                  <td className="p-3 text-sm border border-gray-200">{slot.maxMarks}</td>
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
                            <li>Electronic devices are strictly prohibited</li>
                            <li>Follow all examination rules and regulations</li>
                            <li>Paste a recent passport-size photograph in the designated area</li>
                          </ul>
                        </div>

                        {/* Signatures */}
                        <div className="signatures flex justify-between mt-8 pt-6">
                          <div className="signature-box text-center">
                            <div className="h-16 border-b border-gray-400 mb-2"></div>
                            <p className="text-sm font-medium text-gray-600">Student's Signature</p>
                          </div>
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
