'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertCircle,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  Plus,
  Download
} from 'lucide-react'

interface DashboardStats {
  totalCollection: number;
  pendingDues: number;
  overdueCount: number;
  todayCollection: number;
  monthlyCollection: number;
  totalStudents: number;
  paidStudents: number;
  pendingStudents: number;
}

export default function FinanceDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const [paymentsRes, duesRes] = await Promise.all([
        fetch(`/api/institution/finance/payments?fromDate=${monthStart.toISOString()}&limit=10`),
        fetch('/api/institution/finance/reports/dues')
      ]);

      const paymentsData = await paymentsRes.json();
      const duesData = await duesRes.json();

      const todayPayments = paymentsData.payments?.filter((p: any) => {
        const paidDate = new Date(p.paidAt);
        return paidDate.toDateString() === today.toDateString();
      }) || [];

      const todayCollection = todayPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const monthlyCollection = paymentsData.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

      setStats({
        totalCollection: monthlyCollection,
        pendingDues: duesData.summary?.totalDues || 0,
        overdueCount: duesData.summary?.overdueCount || 0,
        todayCollection,
        monthlyCollection,
        totalStudents: duesData.summary?.totalStudents || 0,
        paidStudents: 0,
        pendingStudents: duesData.summary?.totalStudents || 0
      });

      setRecentPayments(paymentsData.payments?.slice(0, 5) || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />
      
      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Finance Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Overview of financial operations and transactions</p>
          </div>

          <div className="flex justify-end gap-3 mb-8">
            <Link
              href="/dashboard/finance/payments?action=record"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-dark-900 rounded-xl hover:bg-primary/90 transition-colors font-semibold text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </Link>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-dark-700 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors text-gray-700 dark:text-gray-300 font-semibold text-sm">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Today's Collection</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats?.todayCollection || 0)}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
                <span className="text-green-600 dark:text-green-400 font-semibold">+12.5%</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">from yesterday</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Monthly Collection</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats?.monthlyCollection || 0)}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">This month</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Pending Dues</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats?.pendingDues || 0)}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">{stats?.pendingStudents} students</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Overdue Fees</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {stats?.overdueCount || 0}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-red-600 dark:text-red-400 font-semibold">Requires attention</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-dark-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/dashboard/finance/fee-structures" className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Manage Fee Structures</span>
                </Link>
                <Link href="/dashboard/finance/payments" className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group">
                  <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Record Payment</span>
                </Link>
                <Link href="/dashboard/finance/dues" className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">View Pending Dues</span>
                </Link>
                <Link href="/dashboard/finance/reports" className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Generate Reports</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Payments</h3>
                <Link href="/dashboard/finance/payments" className="text-sm text-primary-700 hover:text-primary font-semibold hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {recentPayments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent payments</p>
                ) : (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                      <div className="flex items-center">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mr-3">
                          <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {payment.studentFee?.student?.fullName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.studentFee?.student?.admissionNumber} • {payment.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(payment.paidAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-dark-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
              <div className="space-y-4">
                {['CASH', 'ONLINE', 'UPI', 'CHEQUE'].map((method) => {
                  const methodPayments = recentPayments.filter(p => p.paymentMethod === method);
                  const total = methodPayments.reduce((sum, p) => sum + p.amount, 0);
                  const percentage = stats?.monthlyCollection ? (total / stats.monthlyCollection * 100) : 0;
                  
                  return (
                    <div key={method}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{method}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{formatCurrency(total)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all shadow-[0_0_10px_rgba(229,243,60,0.3)]" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft p-6 border border-gray-100 dark:border-dark-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Collection Trends</h3>
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Chart placeholder - Integrate with charting library
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
