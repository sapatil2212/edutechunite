'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { ArrowLeft, DollarSign, Download, Plus, Calendar, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudentFee {
  id: string;
  totalAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  feeStructure: {
    id: string;
    name: string;
    components: Array<{
      id: string;
      name: string;
      feeType: string;
      amount: number;
      frequency: string;
    }>;
  };
  discounts: Array<{
    id: string;
    name: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    reason: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    transactionId: string | null;
    receiptNumber: string;
    paidAt: string;
    remarks: string | null;
  }>;
}

interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  academicYear: { name: string };
  academicUnit: { name: string };
}

export default function StudentFeeLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [studentFee, setStudentFee] = useState<StudentFee | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchStudentFeeData();
  }, [params.id]);

  const fetchStudentFeeData = async () => {
    try {
      setLoading(true);
      
      // Fetch student details
      const studentRes = await fetch(`/api/institution/students/${params.id}`);
      const studentData = await studentRes.json();
      setStudent(studentData.student);

      // Fetch student fee details
      const feeRes = await fetch(`/api/institution/finance/student-fees?studentId=${params.id}`);
      const feeData = await feeRes.json();
      
      if (feeData.studentFees && feeData.studentFees.length > 0) {
        setStudentFee(feeData.studentFees[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student fee data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="p-6 lg:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Student Not Found</h1>
              <button
                onClick={() => router.push('/dashboard/students')}
                className="text-primary hover:text-primary/80"
              >
                Back to Students
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
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/dashboard/students/${params.id}`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fee Ledger</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {student.fullName} ({student.admissionNumber}) • {student.academicYear.name} • {student.academicUnit.name}
                </p>
              </div>
            </div>
            {studentFee && studentFee.balanceAmount > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Record Payment
              </button>
            )}
          </div>

          {!studentFee ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">No Fee Structure Assigned</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    This student does not have a fee structure assigned yet.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Fee Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Fee</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(studentFee.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Paid Amount</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(studentFee.paidAmount)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Balance Due</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(studentFee.balanceAmount)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      studentFee.status === 'PAID' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : studentFee.status === 'PARTIAL'
                        ? 'bg-orange-100 dark:bg-orange-900/20'
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      <FileText className={`w-6 h-6 ${
                        studentFee.status === 'PAID' 
                          ? 'text-green-600 dark:text-green-400' 
                          : studentFee.status === 'PARTIAL'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <p className={`text-xl font-bold ${
                        studentFee.status === 'PAID' 
                          ? 'text-green-600 dark:text-green-400' 
                          : studentFee.status === 'PARTIAL'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {studentFee.status === 'PAID' ? 'Fully Paid' : studentFee.status === 'PARTIAL' ? 'Partial' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Structure Details */}
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
                <div className="p-6 border-b border-gray-100 dark:border-dark-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fee Structure: {studentFee.feeStructure.name}</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {studentFee.feeStructure.components.map((component) => (
                      <div key={component.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{component.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {component.feeType} • {component.frequency}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(component.amount)}</p>
                      </div>
                    ))}
                  </div>

                  {studentFee.discounts.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Discounts Applied</h3>
                      <div className="space-y-2">
                        {studentFee.discounts.map((discount) => (
                          <div key={discount.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{discount.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{discount.reason}</p>
                            </div>
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                              - {formatCurrency(discount.discountAmount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                        <span>Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(studentFee.totalAmount)}</span>
                      </div>
                      {studentFee.discountAmount > 0 && (
                        <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                          <span>Total Discount:</span>
                          <span className="font-semibold">- {formatCurrency(studentFee.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-dark-600">
                        <span>Final Amount:</span>
                        <span className="text-primary">{formatCurrency(studentFee.finalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
                <div className="p-6 border-b border-gray-100 dark:border-dark-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment History</h2>
                </div>
                <div className="p-6">
                  {studentFee.payments.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No payments recorded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {studentFee.payments.map((payment) => (
                        <motion.div
                          key={payment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                              <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium rounded">
                                  {payment.paymentMethod}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(payment.paidAt)}
                                </span>
                                <span>Receipt: {payment.receiptNumber}</span>
                                {payment.transactionId && <span>Txn: {payment.transactionId}</span>}
                              </div>
                              {payment.remarks && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{payment.remarks}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => window.open(`/api/receipts/${payment.receiptNumber}`, '_blank')}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Receipt
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
