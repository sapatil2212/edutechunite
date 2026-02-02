"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { 
  CreditCard, DollarSign, Download, Calendar, FileText, 
  AlertCircle, CheckCircle, Clock, TrendingUp, Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionId: string | null;
  receiptNumber: string;
  paidAt: string;
  studentFee: {
    feeStructure: {
      name: string;
      academicYear: {
        name: string;
      };
    };
  };
}

interface StudentFee {
  id: string;
  totalAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  dueDate: string | null;
  feeStructure: {
    name: string;
    academicYear: {
      name: string;
    };
    components: Array<{
      id: string;
      name: string;
      amount: number;
      feeType: string;
    }>;
  };
  discounts: Array<{
    id: string;
    name: string;
    discountType: string;
    discountAmount: number;
  }>;
  scholarships: Array<{
    id: string;
    name: string;
    scholarshipType: string;
    scholarshipAmount: number;
  }>;
}

interface FeesData {
  student: {
    id: string;
    fullName: string;
    admissionNumber: string;
  };
  summary: {
    totalFees: number;
    totalPaid: number;
    totalPending: number;
    totalDiscount: number;
    totalScholarship: number;
  };
  fees: StudentFee[];
  payments: Payment[];
}

export default function StudentFeesPage() {
  const [data, setData] = useState<FeesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

  useEffect(() => {
    fetchFeesData();
  }, []);

  const fetchFeesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/student/fees");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch fees data");
      }

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch fees");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy, hh:mm a");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "PARTIAL":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "PENDING":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const downloadReceipt = (receiptNumber: string) => {
    try {
      setDownloadingReceipt(receiptNumber);
      // Open receipt in new window for printing
      window.open(`/api/receipts/${receiptNumber}`, '_blank');
    } catch (error) {
      console.error("Error opening receipt:", error);
      alert("Failed to open receipt");
    } finally {
      // Reset after a short delay
      setTimeout(() => setDownloadingReceipt(null), 500);
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
              Fee Payment
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View your fee details and payment history
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading fees data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : !data ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No fee data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Fees</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(data.summary.totalFees)}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(data.summary.totalPaid)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(data.summary.totalPending)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Discounts</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(data.summary.totalDiscount + data.summary.totalScholarship)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Structures */}
              {data.fees.length > 0 && (
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                  <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Fee Structures
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {data.fees.map((fee) => (
                      <div
                        key={fee.id}
                        className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {fee.feeStructure.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {fee.feeStructure.academicYear.name}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(fee.status)}`}>
                            {fee.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(fee.finalAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Paid</p>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(fee.paidAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Balance</p>
                            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                              {formatCurrency(fee.balanceAmount)}
                            </p>
                          </div>
                          {fee.dueDate && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Due Date</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {format(new Date(fee.dueDate), "MMM dd, yyyy")}
                              </p>
                            </div>
                          )}
                        </div>

                        {fee.feeStructure.components.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Components:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {fee.feeStructure.components.map((component) => (
                                <div
                                  key={component.id}
                                  className="flex items-center justify-between p-2 bg-white dark:bg-dark-800 rounded"
                                >
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {component.name}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(component.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment History */}
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Payment History
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  {data.payments.length === 0 ? (
                    <div className="p-8 text-center">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No payments recorded yet</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-dark-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Fee Structure
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Receipt
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                        {data.payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {formatDate(payment.paidAt)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {payment.studentFee.feeStructure.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {payment.studentFee.feeStructure.academicYear.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(payment.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {payment.paymentMethod}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {payment.receiptNumber}
                              </span>
                              {payment.transactionId && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Txn: {payment.transactionId}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button
                                onClick={() => downloadReceipt(payment.receiptNumber)}
                                disabled={downloadingReceipt === payment.receiptNumber}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                <Download className="w-4 h-4" />
                                {downloadingReceipt === payment.receiptNumber ? "Downloading..." : "PDF"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
