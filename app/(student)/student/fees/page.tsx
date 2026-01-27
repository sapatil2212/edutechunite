'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  CreditCard, 
  History, 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Calendar,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const MOCK_FEES = [
  {
    id: '1',
    title: 'Tuition Fee - Quarter 3',
    amount: 1200,
    dueDate: '2026-03-15',
    status: 'PENDING',
    category: 'ACADEMIC'
  },
  {
    id: '2',
    title: 'Transportation Fee - March',
    amount: 150,
    dueDate: '2026-03-05',
    status: 'PENDING',
    category: 'FACILITY'
  },
  {
    id: '3',
    title: 'Tuition Fee - Quarter 2',
    amount: 1200,
    dueDate: '2025-12-15',
    status: 'PAID',
    category: 'ACADEMIC',
    paidAt: '2025-12-10'
  },
  {
    id: '4',
    title: 'Library Membership Fee',
    amount: 50,
    dueDate: '2025-11-01',
    status: 'PAID',
    category: 'OTHER',
    paidAt: '2025-10-28'
  }
]

export default function StudentFeesPage() {
  const [loading, setLoading] = useState(false)

  const totalPaid = MOCK_FEES.filter(f => f.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0)
  const totalPending = MOCK_FEES.filter(f => f.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fees & Payments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your institutional fees and transaction history</p>
        </div>
        <Button className="bg-primary hover:bg-primary-600 text-white border-none rounded-xl h-11 px-6 font-bold shadow-soft flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Pay Pending Fees
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Amount"
          value={`$${totalPending}`}
          change="Due soon"
          trend="down"
          icon={Clock}
          color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
        />
        <StatCard
          title="Paid Amount"
          value={`$${totalPaid}`}
          change="This year"
          trend="up"
          icon={CheckCircle2}
          color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Total Fees"
          value={`$${totalPaid + totalPending}`}
          change="Annual total"
          trend="up"
          icon={Wallet}
          color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Next Due Date"
          value="Mar 05"
          change="Transportation"
          trend="down"
          icon={Calendar}
          color="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Fee Breakdown */}
        <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden">
          <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600" />
              Fee Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-dark-900/50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                  {MOCK_FEES.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white">{fee.title}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{fee.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-600 dark:text-gray-400">
                        {new Date(fee.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-black text-gray-900 dark:text-white">
                        ${fee.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant={fee.status === 'PAID' ? 'success' : 'warning'} className="font-bold text-[10px]">
                          {fee.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {fee.status === 'PAID' ? (
                          <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all">
                            <Download className="w-4 h-4" />
                          </button>
                        ) : (
                          <button className="text-xs font-bold text-primary-600 hover:underline">Pay Now</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="border-none shadow-soft overflow-hidden">
          <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary-600" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {MOCK_FEES.filter(f => f.status === 'PAID').map((payment) => (
                <div key={payment.id} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 shrink-0">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{payment.title}</h4>
                      <span className="text-sm font-black text-green-600">${payment.amount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>Paid on {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}</span>
                      <span className="text-primary-600 cursor-pointer hover:underline">Receipt</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider">Important Note</h4>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 leading-relaxed font-medium">
                    A late fee of $10 per day will be applicable for payments made after the due date. Please ensure timely payments to avoid penalties.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
