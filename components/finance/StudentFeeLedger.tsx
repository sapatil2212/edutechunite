'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Download, 
  Calendar,
  Receipt,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  receiptNumber: string
  paidAt: string
  transactionId?: string
  remarks?: string
}

interface Discount {
  id: string
  name: string
  discountType: string
  discountValue: number
  discountAmount: number
  reason: string
  createdAt: string
}

interface Scholarship {
  id: string
  name: string
  scholarshipAmount: number
  provider?: string
  status: string
  createdAt: string
}

interface StudentFeeLedgerProps {
  studentId: string
  academicYearId?: string
}

export function StudentFeeLedger({ studentId, academicYearId }: StudentFeeLedgerProps) {
  const [studentFees, setStudentFees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  useEffect(() => {
    fetchStudentFees()
  }, [studentId, academicYearId])

  const fetchStudentFees = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = `/api/institution/finance/student-fees?studentId=${studentId}`
      if (academicYearId) url += `&academicYearId=${academicYearId}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch fee records')

      const data = await response.json()
      setStudentFees(data.studentFees || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredFees = studentFees.filter(fee => {
    if (filter === 'pending') return fee.status !== 'PAID'
    if (filter === 'paid') return fee.status === 'PAID'
    return true
  })

  const totalDue = filteredFees.reduce((sum, fee) => sum + fee.balanceAmount, 0)
  const totalPaid = filteredFees.reduce((sum, fee) => sum + fee.paidAmount, 0)

  const getStatusBadge = (status: string) => {
    const styles = {
      PAID: 'bg-green-100 text-green-800 border-green-200',
      PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PENDING: 'bg-red-100 text-red-800 border-red-200',
      OVERDUE: 'bg-red-100 text-red-800 border-red-200',
    }
    const icons = {
      PAID: CheckCircle,
      PARTIAL: Clock,
      PENDING: AlertCircle,
      OVERDUE: AlertCircle,
    }
    const Icon = icons[status as keyof typeof icons] || AlertCircle
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-900">Error loading fee records</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-xl font-bold text-gray-900">₹{totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Due</p>
              <p className="text-xl font-bold text-gray-900">₹{totalDue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fee Records</p>
              <p className="text-xl font-bold text-gray-900">{studentFees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-gray-400" />
        <div className="flex gap-2">
          {['all', 'pending', 'paid'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Fee Records */}
      <div className="space-y-4">
        {filteredFees.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No fee records found</p>
          </div>
        ) : (
          filteredFees.map((fee) => (
            <motion.div
              key={fee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Fee Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {fee.feeStructure.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {fee.feeStructure.academicYear.name}
                      {fee.feeStructure.academicUnit && ` • ${fee.feeStructure.academicUnit.name}`}
                    </p>
                  </div>
                  {getStatusBadge(fee.status)}
                </div>
              </div>

              {/* Fee Details */}
              <div className="p-6 space-y-4">
                {/* Amount Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                    <p className="font-semibold text-gray-900">₹{fee.totalAmount.toFixed(2)}</p>
                  </div>
                  {fee.discountAmount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Discount</p>
                      <p className="font-semibold text-green-600">- ₹{fee.discountAmount.toFixed(2)}</p>
                    </div>
                  )}
                  {fee.scholarshipAmount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Scholarship</p>
                      <p className="font-semibold text-green-600">- ₹{fee.scholarshipAmount.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Final Amount</p>
                    <p className="font-semibold text-blue-600">₹{fee.finalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Paid</p>
                    <p className="font-semibold text-green-600">₹{fee.paidAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Balance</p>
                    <p className="font-semibold text-orange-600">₹{fee.balanceAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Discounts */}
                {fee.discounts && fee.discounts.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Discounts Applied</p>
                    <div className="space-y-2">
                      {fee.discounts.map((discount: Discount) => (
                        <div key={discount.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{discount.name}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{discount.reason}</p>
                            </div>
                            <span className="text-sm font-semibold text-green-700">
                              - ₹{discount.discountAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scholarships */}
                {fee.scholarships && fee.scholarships.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Scholarships</p>
                    <div className="space-y-2">
                      {fee.scholarships.map((scholarship: Scholarship) => (
                        <div key={scholarship.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{scholarship.name}</p>
                              {scholarship.provider && (
                                <p className="text-xs text-gray-600 mt-0.5">Provider: {scholarship.provider}</p>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-blue-700">
                              - ₹{scholarship.scholarshipAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment History */}
                {fee.payments && fee.payments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Payment History</p>
                    <div className="space-y-2">
                      {fee.payments.map((payment: Payment) => (
                        <div key={payment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-gray-400" />
                                <p className="font-medium text-sm text-gray-900">
                                  Receipt: {payment.receiptNumber}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(payment.paidAt).toLocaleDateString()}
                                </span>
                                <span>{payment.paymentMethod}</span>
                                {payment.transactionId && (
                                  <span className="font-mono">TXN: {payment.transactionId}</span>
                                )}
                              </div>
                              {payment.remarks && (
                                <p className="text-xs text-gray-500 mt-1">{payment.remarks}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-900">
                                ₹{payment.amount.toFixed(2)}
                              </span>
                              <button
                                onClick={() => {
                                  window.open(`/api/institution/finance/receipts/${payment.id}?format=pdf`, '_blank')
                                }}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Download Receipt"
                              >
                                <Download className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
