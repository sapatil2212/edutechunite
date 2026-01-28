'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Edit2, Plus, Trash2, AlertCircle, CheckCircle2, Percent } from 'lucide-react';

interface FeeComponent {
  id?: string;
  name: string;
  feeType: string;
  amount: number;
  frequency: string;
  isMandatory: boolean;
  description?: string;
}

interface FeeStructure {
  id: string;
  name: string;
  description: string;
  components: FeeComponent[];
}

interface Discount {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  reason: string;
  appliedTo: 'TOTAL' | string; // 'TOTAL' or component id
}

interface StudentFeeOnboardingProps {
  academicYearId: string;
  classId: string;
  sectionId?: string;
  onFeeDataChange: (data: {
    feeStructureId: string;
    components: FeeComponent[];
    discounts: Discount[];
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
  }) => void;
}

export function StudentFeeOnboarding({
  academicYearId,
  classId,
  sectionId,
  onFeeDataChange
}: StudentFeeOnboardingProps) {
  const [loading, setLoading] = useState(true);
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
  const [components, setComponents] = useState<FeeComponent[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isOverridden, setIsOverridden] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [newDiscount, setNewDiscount] = useState<Discount>({
    type: 'PERCENTAGE',
    value: 0,
    reason: '',
    appliedTo: 'TOTAL'
  });

  useEffect(() => {
    if (academicYearId && classId) {
      fetchFeeStructure();
    }
  }, [academicYearId, classId, sectionId]);

  useEffect(() => {
    calculateAndNotify();
  }, [components, discounts]);

  const fetchFeeStructure = async () => {
    try {
      setLoading(true);
      
      // Try to fetch fee structure for the specific section/class
      const academicUnitId = sectionId || classId;
      console.log('Fetching fee structure for:', { academicYearId, classId, sectionId, academicUnitId });
      
      const res = await fetch(
        `/api/institution/finance/fee-structures?academicYearId=${academicYearId}&academicUnitId=${academicUnitId}&isActive=true`
      );
      const data = await res.json();
      
      console.log('Fee structure API response:', data);
      
      if (data.feeStructures && data.feeStructures.length > 0) {
        // Prioritize: section-specific > class-level > global
        // The API already returns them, we just pick the most specific one
        let structure = data.feeStructures.find((fs: any) => fs.academicUnitId === academicUnitId);
        
        // If no exact match, try to find one for the class (if we're looking at a section)
        if (!structure && sectionId) {
          structure = data.feeStructures.find((fs: any) => fs.academicUnitId === classId);
        }
        
        // If still no match, use the first one (could be global or any available)
        if (!structure) {
          structure = data.feeStructures[0];
        }
        
        console.log('Selected fee structure:', structure);
        
        setFeeStructure(structure);
        setComponents(structure.components.map((c: any) => ({
          id: c.id,
          name: c.name,
          feeType: c.feeType,
          amount: c.amount,
          frequency: c.frequency,
          isMandatory: c.isMandatory,
          description: c.description
        })));
      } else {
        console.log('No fee structures found');
        setFeeStructure(null);
        setComponents([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fee structure:', error);
      setLoading(false);
    }
  };

  const calculateAndNotify = () => {
    if (!feeStructure) return;

    const totalAmount = components.reduce((sum, c) => sum + c.amount, 0);
    let discountAmount = 0;

    discounts.forEach(discount => {
      if (discount.appliedTo === 'TOTAL') {
        if (discount.type === 'PERCENTAGE') {
          discountAmount += (totalAmount * discount.value) / 100;
        } else {
          discountAmount += discount.value;
        }
      } else {
        const component = components.find(c => c.id === discount.appliedTo);
        if (component) {
          if (discount.type === 'PERCENTAGE') {
            discountAmount += (component.amount * discount.value) / 100;
          } else {
            discountAmount += discount.value;
          }
        }
      }
    });

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    onFeeDataChange({
      feeStructureId: feeStructure.id,
      components,
      discounts,
      totalAmount,
      discountAmount,
      finalAmount
    });
  };

  const updateComponentAmount = (index: number, amount: number) => {
    const updated = [...components];
    updated[index] = { ...updated[index], amount };
    setComponents(updated);
    setIsOverridden(true);
  };

  const addDiscount = () => {
    if (!newDiscount.reason.trim() || newDiscount.value <= 0) {
      alert('Please provide discount value and reason');
      return;
    }

    setDiscounts([...discounts, { ...newDiscount }]);
    setNewDiscount({
      type: 'PERCENTAGE',
      value: 0,
      reason: '',
      appliedTo: 'TOTAL'
    });
    setShowDiscountForm(false);
  };

  const removeDiscount = (index: number) => {
    setDiscounts(discounts.filter((_, i) => i !== index));
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
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!feeStructure) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">No Fee Structure Found</h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
              No active fee structure is configured for the selected class. Please configure a fee structure first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalAmount = components.reduce((sum, c) => sum + c.amount, 0);
  let discountAmount = 0;

  discounts.forEach(discount => {
    if (discount.appliedTo === 'TOTAL') {
      if (discount.type === 'PERCENTAGE') {
        discountAmount += (totalAmount * discount.value) / 100;
      } else {
        discountAmount += discount.value;
      }
    } else {
      const component = components.find(c => c.id === discount.appliedTo);
      if (component) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount += (component.amount * discount.value) / 100;
        } else {
          discountAmount += discount.value;
        }
      }
    }
  });

  const finalAmount = Math.max(0, totalAmount - discountAmount);

  return (
    <div className="space-y-6">
      {/* Fee Structure Header */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{feeStructure.name}</h3>
            {feeStructure.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{feeStructure.description}</p>
            )}
          </div>
          {isOverridden && (
            <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs font-medium rounded-full">
              Custom Amounts
            </span>
          )}
        </div>

        {/* Fee Components */}
        <div className="space-y-3">
          {components.map((component, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{component.name}</h4>
                  {component.isMandatory && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium rounded">
                      Mandatory
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>Type: {component.feeType}</span>
                  <span>Frequency: {component.frequency}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">₹</span>
                  <input
                    type="number"
                    value={component.amount}
                    onChange={(e) => updateComponentAmount(index, parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 text-right border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                    min="0"
                  />
                </div>
                <Edit2 className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discounts Section */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Discounts & Scholarships</h3>
          <button
            type="button"
            onClick={() => setShowDiscountForm(!showDiscountForm)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Discount
          </button>
        </div>

        {/* Discount Form */}
        {showDiscountForm && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Type
                </label>
                <select
                  value={newDiscount.type}
                  onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  value={newDiscount.value || ''}
                  onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                  placeholder={newDiscount.type === 'PERCENTAGE' ? '0-100' : '0'}
                  min="0"
                  max={newDiscount.type === 'PERCENTAGE' ? 100 : undefined}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason (Mandatory)
              </label>
              <input
                type="text"
                value={newDiscount.reason}
                onChange={(e) => setNewDiscount({ ...newDiscount, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                placeholder="e.g., Sibling discount, Merit scholarship"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addDiscount}
                className="px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                Apply Discount
              </button>
              <button
                type="button"
                onClick={() => setShowDiscountForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Applied Discounts */}
        {discounts.length > 0 ? (
          <div className="space-y-2">
            {discounts.map((discount, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Percent className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {discount.type === 'PERCENTAGE' ? `${discount.value}%` : formatCurrency(discount.value)} discount
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{discount.reason}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDiscount(index)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No discounts applied
          </p>
        )}
      </div>

      {/* Fee Summary */}
      <div className="bg-gradient-to-br from-primary/10 to-blue-50 dark:from-primary/5 dark:to-dark-700 rounded-xl shadow-sm border border-primary/20 dark:border-primary/10 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fee Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
            <span>Total Fee Amount:</span>
            <span className="font-semibold">{formatCurrency(totalAmount)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-green-600 dark:text-green-400">
              <span>Total Discount:</span>
              <span className="font-semibold">- {formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-gray-300 dark:border-dark-600">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Net Payable Amount:</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(finalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
