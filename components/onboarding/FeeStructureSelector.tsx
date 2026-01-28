'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Plus, 
  Minus, 
  AlertCircle, 
  CheckCircle,
  Info,
  Percent,
  IndianRupee
} from 'lucide-react'

interface FeeComponent {
  id: string
  name: string
  feeType: string
  amount: number
  frequency: string
  isMandatory: boolean
  description?: string
}

interface FeeStructure {
  id: string
  name: string
  description?: string
  components: FeeComponent[]
  academicYear: {
    name: string
  }
  academicUnit?: {
    name: string
  }
}

interface Discount {
  name: string
  description?: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  reason: string
}

interface FeeStructureSelectorProps {
  academicYearId: string
  academicUnitId: string
  onFeeStructureSelect: (data: {
    feeStructureId: string
    totalAmount: number
    finalAmount: number
    discounts: Discount[]
    customComponents?: FeeComponent[]
  }) => void
}

export function FeeStructureSelector({
  academicYearId,
  academicUnitId,
  onFeeStructureSelect
}: FeeStructureSelectorProps) {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [customComponents, setCustomComponents] = useState<FeeComponent[]>([])
  const [isCustom, setIsCustom] = useState(false)
  
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [newDiscount, setNewDiscount] = useState<Discount>({
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    reason: ''
  })

  useEffect(() => {
    fetchFeeStructures()
  }, [academicYearId, academicUnitId])

  const fetchFeeStructures = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `/api/institution/finance/fee-structures?academicYearId=${academicYearId}&academicUnitId=${academicUnitId}&isActive=true`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch fee structures')

      const data = await response.json()
      setFeeStructures(data.feeStructures)

      if (data.feeStructures.length === 1) {
        handleStructureSelect(data.feeStructures[0])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStructureSelect = (structure: FeeStructure) => {
    setSelectedStructure(structure)
    setCustomComponents(structure.components)
    setIsCustom(false)
    setDiscounts([])
    calculateAndNotify(structure.components, [])
  }

  const calculateTotalAmount = (components: FeeComponent[]) => {
    return components.reduce((sum, comp) => sum + comp.amount, 0)
  }

  const calculateDiscountAmount = (total: number, discountList: Discount[]) => {
    return discountList.reduce((sum, discount) => {
      if (discount.discountType === 'PERCENTAGE') {
        return sum + (total * discount.discountValue) / 100
      }
      return sum + discount.discountValue
    }, 0)
  }

  const calculateAndNotify = (components: FeeComponent[], discountList: Discount[]) => {
    const total = calculateTotalAmount(components)
    const discountAmount = calculateDiscountAmount(total, discountList)
    const final = Math.max(0, total - discountAmount)

    if (selectedStructure) {
      onFeeStructureSelect({
        feeStructureId: selectedStructure.id,
        totalAmount: total,
        finalAmount: final,
        discounts: discountList,
        customComponents: isCustom ? components : undefined
      })
    }
  }

  const handleComponentAmountChange = (index: number, newAmount: number) => {
    const updated = [...customComponents]
    updated[index] = { ...updated[index], amount: newAmount }
    setCustomComponents(updated)
    setIsCustom(true)
    calculateAndNotify(updated, discounts)
  }

  const addDiscount = () => {
    if (!newDiscount.name || !newDiscount.reason || newDiscount.discountValue <= 0) {
      alert('Please fill all discount fields')
      return
    }

    const updatedDiscounts = [...discounts, newDiscount]
    setDiscounts(updatedDiscounts)
    setNewDiscount({
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      reason: ''
    })
    setShowDiscountForm(false)
    calculateAndNotify(customComponents, updatedDiscounts)
  }

  const removeDiscount = (index: number) => {
    const updated = discounts.filter((_, i) => i !== index)
    setDiscounts(updated)
    calculateAndNotify(customComponents, updated)
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
          <p className="font-medium text-red-900">Error loading fee structures</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (feeStructures.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900">No fee structure found</p>
          <p className="text-sm text-yellow-700 mt-1">
            Please create a fee structure for this class and academic year first.
          </p>
        </div>
      </div>
    )
  }

  const totalAmount = calculateTotalAmount(customComponents)
  const discountAmount = calculateDiscountAmount(totalAmount, discounts)
  const finalAmount = Math.max(0, totalAmount - discountAmount)

  return (
    <div className="space-y-6">
      {/* Fee Structure Selection */}
      {feeStructures.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Fee Structure
          </label>
          <select
            value={selectedStructure?.id || ''}
            onChange={(e) => {
              const structure = feeStructures.find(s => s.id === e.target.value)
              if (structure) handleStructureSelect(structure)
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select a fee structure</option>
            {feeStructures.map(structure => (
              <option key={structure.id} value={structure.id}>
                {structure.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedStructure && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Fee Structure Details */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{selectedStructure.name}</h3>
                {selectedStructure.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedStructure.description}</p>
                )}
              </div>
            </div>

            {/* Fee Components */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Fee Components</h4>
              {customComponents.map((component, index) => (
                <div
                  key={component.id}
                  className="bg-white rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{component.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {component.frequency} • {component.isMandatory ? 'Mandatory' : 'Optional'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={component.amount}
                        onChange={(e) => handleComponentAmountChange(index, parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-primary focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discounts Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Discounts</h4>
              <button
                onClick={() => setShowDiscountForm(!showDiscountForm)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Discount
              </button>
            </div>

            {showDiscountForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Discount Name *
                    </label>
                    <input
                      type="text"
                      value={newDiscount.name}
                      onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., Sibling Discount"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={newDiscount.discountType}
                      onChange={(e) => setNewDiscount({ ...newDiscount, discountType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={newDiscount.discountValue}
                    onChange={(e) => setNewDiscount({ ...newDiscount, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder={newDiscount.discountType === 'PERCENTAGE' ? 'Enter percentage' : 'Enter amount'}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <textarea
                    value={newDiscount.reason}
                    onChange={(e) => setNewDiscount({ ...newDiscount, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                    placeholder="Reason for discount"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={addDiscount}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    Apply Discount
                  </button>
                  <button
                    onClick={() => setShowDiscountForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {discounts.length > 0 && (
              <div className="space-y-2">
                {discounts.map((discount, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{discount.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{discount.reason}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-green-700">
                        {discount.discountType === 'PERCENTAGE' 
                          ? `${discount.discountValue}%` 
                          : `₹${discount.discountValue}`}
                      </span>
                      <button
                        onClick={() => removeDiscount(index)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Minus className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fee Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Fee Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium text-gray-900">₹{totalAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Discount</span>
                  <span className="font-medium text-green-600">- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-blue-300 flex justify-between">
                <span className="font-semibold text-gray-900">Final Amount</span>
                <span className="font-bold text-xl text-blue-600">₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {isCustom && (
              <div className="mt-4 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Custom fee amounts have been applied. This will override the default fee structure.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
