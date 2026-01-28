'use client';

import { useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Printer,
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  Users,
  RefreshCw,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Payment {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId: string | null;
  paidAt: string;
  status: string;
  remarks: string | null;
  student: {
    fullName: string;
    admissionNumber: string;
    academicUnit: { name: string };
  };
  studentFee: {
    finalAmount: number;
    balanceAmount: number;
  };
}

interface Stats {
  totalCollected: number;
  totalPayments: number;
  pendingAmount: number;
  todayCollection: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCollected: 0,
    totalPayments: 0,
    pendingAmount: 0,
    todayCollection: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [searchQuery, selectedMethod, selectedStatus, dateFilter, payments]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/institution/finance/payments');
      const data = await res.json();

      if (data.payments) {
        setPayments(data.payments);
        calculateStats(data.payments);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData: Payment[]) => {
    const totalCollected = paymentsData.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = paymentsData.length;

    const today = new Date().toDateString();
    const todayCollection = paymentsData
      .filter(p => new Date(p.paidAt).toDateString() === today)
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({
      totalCollected,
      totalPayments,
      pendingAmount: 0, // This would come from student fees API
      todayCollection,
    });
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Payment method filter
    if (selectedMethod !== 'ALL') {
      filtered = filtered.filter((p) => p.paymentMethod === selectedMethod);
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      filtered = filtered.filter((p) => {
        const paymentDate = new Date(p.paidAt);
        switch (dateFilter) {
          case 'TODAY':
            return paymentDate.toDateString() === now.toDateString();
          case 'WEEK':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return paymentDate >= weekAgo;
          case 'MONTH':
            return (
              paymentDate.getMonth() === now.getMonth() &&
              paymentDate.getFullYear() === now.getFullYear()
            );
          default:
            return true;
        }
      });
    }

    setFilteredPayments(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    const headers = ['Receipt No', 'Student', 'Admission No', 'Amount', 'Method', 'Date', 'Status'];
    const rows = filteredPayments.map((p) => [
      p.receiptNumber,
      p.student.fullName,
      p.student.admissionNumber,
      p.amount,
      p.paymentMethod,
      formatDate(p.paidAt),
      p.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track and manage all fee payments
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => fetchPayments()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Collected</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalCollected)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalPayments}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Collection</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.todayCollection)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unique Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(payments.map(p => p.student.admissionNumber)).size}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student name, admission no, or receipt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:w-auto"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-dark-600">
                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                      >
                        <option value="ALL">All Methods</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="DD">DD</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                      >
                        <option value="ALL">All Status</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                      </select>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date Range
                      </label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                      >
                        <option value="ALL">All Time</option>
                        <option value="TODAY">Today</option>
                        <option value="WEEK">Last 7 Days</option>
                        <option value="MONTH">This Month</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Payments Table */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No payments found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Receipt No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                    {filteredPayments.map((payment) => (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.receiptNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.student.fullName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.student.admissionNumber} • {payment.student.academicUnit.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(payment.amount)}
                          </div>
                          {payment.studentFee.balanceAmount > 0 && (
                            <div className="text-xs text-orange-600 dark:text-orange-400">
                              Balance: {formatCurrency(payment.studentFee.balanceAmount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(payment.paidAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            payment.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : payment.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/finance/receipts/${payment.receiptNumber}`}>
                              <button
                                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                                title="View Receipt"
                              >
                                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            </Link>
                            <button
                              onClick={() => window.open(`/dashboard/finance/receipts/${payment.receiptNumber}`, '_blank')}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/dashboard/finance/receipts/${payment.receiptNumber}`;
                                link.target = '_blank';
                                link.click();
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                              title="Download Receipt"
                            >
                              <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Info */}
            {filteredPayments.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredPayments.length} of {payments.length} payments
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
