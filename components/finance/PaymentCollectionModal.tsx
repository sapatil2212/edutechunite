'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  CreditCard, 
  Banknote, 
  Building2, 
  Smartphone,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface PaymentCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  studentFee: {
    id: string
    student: {
      fullName: string
      admissionNumber: string
    }
    feeStructure: {
      name: string
      academicYear: { name: string }
      academicUnit?: { name: string }
    }
    totalAmount: number
    discountAmount: number
    scholarshipAmount: number
    finalAmount: number
    paidAmount: number
    balanceAmount: number
  }
  onPaymentSuccess: (payment: any) => void
}

const paymentMethods = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2 },
  { value: 'CHEQUE', label: 'Cheque', icon: Banknote },
  { value: 'DEMAND_DRAFT', label: 'Demand Draft', icon: Banknote },
]

export function PaymentCollectionModal({
  isOpen,
  onClose,
  studentFee,
  onPaymentSuccess
}: PaymentCollectionModalProps) {
  const [formData, setFormData] = useState({
    amount: studentFee.balanceAmount,
    paymentMethod: 'CASH',
    transactionId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    bankName: '',
    branchName: '',
    remarks: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.amount <= 0 || formData.amount > studentFee.balanceAmount) {
      setError('Invalid payment amount')
      return
    }

    if (!formData.paymentMethod) {
      setError('Please select a payment method')
      return
    }

    if (['UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'NET_BANKING'].includes(formData.paymentMethod) && !formData.transactionId) {
      setError('Transaction ID is required for this payment method')
      return
    }

    if (['CHEQUE', 'DEMAND_DRAFT'].includes(formData.paymentMethod) && !formData.referenceNumber) {
      setError('Reference number is required for this payment method')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/institution/finance/payments/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentFeeId: studentFee.id,
          ...formData
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to collect payment')
      }

      const data = await response.json()
      setPaymentResult(data.payment)
      setSuccess(true)
      onPaymentSuccess(data.payment)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = async (format: 'pdf' | 'excel' | 'word') => {
    if (!paymentResult) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `/api/institution/finance/receipts/${paymentResult.id}?format=${format}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to download receipt')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${paymentResult.receiptNumber}.${format === 'excel' ? 'csv' : format === 'word' ? 'doc' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert('Failed to download receipt: ' + err.message)
    }
  }

  const resetAndClose = () => {
    setFormData({
      amount: studentFee.balanceAmount,
      paymentMethod: 'CASH',
      transactionId: '',
      transactionDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      bankName: '',
      branchName: '',
      remarks: ''
    })
    setError(null)
    setSuccess(false)
    setPaymentResult(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {success ? 'Payment Successful' : 'Collect Fee Payment'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {studentFee.student.fullName} ({studentFee.student.admissionNumber})
              </p>
            </div>
            <button
              onClick={resetAndClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {success && paymentResult ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Payment Collected Successfully!
                  </h3>
                  <p className="text-sm text-green-700">
                    Receipt Number: <span className="font-mono font-bold">{paymentResult.receiptNumber}</span>
                  </p>
                </div>

                {/* Payment Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-semibold text-gray-900">₹{paymentResult.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium text-gray-900">{paymentResult.paymentMethod}</span>
                  </div>
                  {paymentResult.transactionId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transaction ID</span>
                      <span className="font-mono text-xs text-gray-900">{paymentResult.transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining Balance</span>
                    <span className="font-semibold text-orange-600">
                      ₹{paymentResult.studentFee.balanceAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Download Receipt */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Download Receipt</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleDownloadReceipt('pdf')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">PDF</span>
                    </button>
                    <button
                      onClick={() => handleDownloadReceipt('excel')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Excel</span>
                    </button>
                    <button
                      onClick={() => handleDownloadReceipt('word')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Word</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={resetAndClose}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Close
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Fee Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Fee Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Fee</span>
                      <span className="font-medium">₹{studentFee.totalAmount.toFixed(2)}</span>
                    </div>
                    {studentFee.discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium text-green-600">- ₹{studentFee.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {studentFee.scholarshipAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scholarship</span>
                        <span className="font-medium text-green-600">- ₹{studentFee.scholarshipAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="font-semibold">Final Amount</span>
                      <span className="font-bold">₹{studentFee.finalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid</span>
                      <span className="font-medium text-green-600">₹{studentFee.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="font-semibold text-orange-600">Balance Due</span>
                      <span className="font-bold text-xl text-orange-600">₹{studentFee.balanceAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="0"
                      max={studentFee.balanceAmount}
                      step="0.01"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ₹{studentFee.balanceAmount.toFixed(2)}
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                          className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg transition-all ${
                            formData.paymentMethod === method.value
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${formData.paymentMethod === method.value ? 'text-primary' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${formData.paymentMethod === method.value ? 'text-primary' : 'text-gray-700'}`}>
                            {method.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Conditional Fields */}
                {['UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'NET_BANKING'].includes(formData.paymentMethod) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter transaction ID"
                      required
                    />
                  </div>
                )}

                {['CHEQUE', 'DEMAND_DRAFT'].includes(formData.paymentMethod) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {formData.paymentMethod === 'CHEQUE' ? 'Cheque' : 'DD'} Number *
                      </label>
                      <input
                        type="text"
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter number"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter bank name"
                      />
                    </div>
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Add any additional notes..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Collect Payment'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
