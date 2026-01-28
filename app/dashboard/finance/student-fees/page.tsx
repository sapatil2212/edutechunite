'use client';

import { useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  FileText,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  student: {
    id: string;
    fullName: string;
    admissionNumber: string;
    academicUnit: { name: string };
  };
  feeStructure: {
    name: string;
    academicYear: { name: string };
  };
  payments: Array<{
    id: string;
    amount: number;
    receiptNumber: string;
  }>;
  discounts: Array<{
    name: string;
    discountAmount: number;
  }>;
}

interface Stats {
  totalStudents: number;
  totalFeeAmount: number;
  totalCollected: number;
  totalPending: number;
  fullyPaid: number;
  partiallyPaid: number;
  unpaid: number;
}

export default function StudentFeesPage() {
  const router = useRouter();
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [filteredFees, setFilteredFees] = useState<StudentFee[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalFeeAmount: 0,
    totalCollected: 0,
    totalPending: 0,
    fullyPaid: 0,
    partiallyPaid: 0,
    unpaid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStudentFees();
  }, []);

  useEffect(() => {
    filterFees();
  }, [searchQuery, selectedStatus, selectedYear, studentFees]);

  const fetchStudentFees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/institution/finance/student-fees');
      const data = await res.json();

      if (data.studentFees) {
        setStudentFees(data.studentFees);
        calculateStats(data.studentFees);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student fees:', error);
      setLoading(false);
    }
  };

  const calculateStats = (fees: StudentFee[]) => {
    const totalStudents = fees.length;
    const totalFeeAmount = fees.reduce((sum, f) => sum + f.finalAmount, 0);
    const totalCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalPending = fees.reduce((sum, f) => sum + f.balanceAmount, 0);
    
    const fullyPaid = fees.filter(f => f.status === 'PAID').length;
    const partiallyPaid = fees.filter(f => f.status === 'PARTIAL').length;
    const unpaid = fees.filter(f => f.status === 'PENDING').length;

    setStats({
      totalStudents,
      totalFeeAmount,
      totalCollected,
      totalPending,
      fullyPaid,
      partiallyPaid,
      unpaid,
    });
  };

  const filterFees = () => {
    let filtered = [...studentFees];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (f) =>
          f.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.feeStructure.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter((f) => f.status === selectedStatus);
    }

    // Academic year filter
    if (selectedYear !== 'ALL') {
      filtered = filtered.filter((f) => f.feeStructure.academicYear.name === selectedYear);
    }

    setFilteredFees(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Fully Paid
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Partial
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
            {status}
          </span>
        );
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Student Name',
      'Admission No',
      'Class',
      'Fee Structure',
      'Total Amount',
      'Discount',
      'Final Amount',
      'Paid',
      'Balance',
      'Status',
    ];
    const rows = filteredFees.map((f) => [
      f.student.fullName,
      f.student.admissionNumber,
      f.student.academicUnit.name,
      f.feeStructure.name,
      f.totalAmount,
      f.discountAmount,
      f.finalAmount,
      f.paidAmount,
      f.balanceAmount,
      f.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_fees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const uniqueYears = Array.from(
    new Set(studentFees.map((f) => f.feeStructure.academicYear.name))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Fees</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and track student fee assignments
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => fetchStudentFees()}>
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
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalStudents}
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
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Fee Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalFeeAmount)}
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
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
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
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalPending)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Status Summary */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fully Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.fullyPaid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Partially Paid</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.partiallyPaid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unpaid</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.unpaid}</p>
              </div>
            </div>
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
                    placeholder="Search by student name, admission no, or fee structure..."
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-dark-600">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Payment Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                      >
                        <option value="ALL">All Status</option>
                        <option value="PAID">Fully Paid</option>
                        <option value="PARTIAL">Partially Paid</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Academic Year
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                      >
                        <option value="ALL">All Years</option>
                        {uniqueYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Student Fees Table */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredFees.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No student fees found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fee Structure
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Balance
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
                    {filteredFees.map((fee) => (
                      <motion.tr
                        key={fee.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {fee.student.fullName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {fee.student.admissionNumber} • {fee.student.academicUnit.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {fee.feeStructure.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {fee.feeStructure.academicYear.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(fee.finalAmount)}
                          </div>
                          {fee.discountAmount > 0 && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              Discount: {formatCurrency(fee.discountAmount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(fee.paidAmount)}
                          </div>
                          {fee.payments.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {fee.payments.length} payment{fee.payments.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${
                            fee.balanceAmount > 0 
                              ? 'text-orange-600 dark:text-orange-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {formatCurrency(fee.balanceAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(fee.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/dashboard/students/${fee.student.id}/fees`}>
                            <button
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Info */}
            {filteredFees.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredFees.length} of {studentFees.length} student fees
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
