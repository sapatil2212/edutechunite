'use client';

import { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Building2, FileText, AlertCircle } from 'lucide-react';

interface PaymentData {
  amountCollected: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'DD';
  transactionId?: string;
  referenceNumber?: string;
  bankName?: string;
  branchName?: string;
  collectedBy: string;
  remarks?: string;
}

interface PaymentCollectionOnboardingProps {
  finalAmount: number;
  onPaymentDataChange: (data: PaymentData | null) => void;
}

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2 },
  { value: 'CHEQUE', label: 'Cheque', icon: FileText },
  { value: 'DD', label: 'Demand Draft', icon: FileText },
];

export function PaymentCollectionOnboarding({ 
  finalAmount, 
  onPaymentDataChange 
}: PaymentCollectionOnboardingProps) {
  const [collectPayment, setCollectPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amountCollected: finalAmount,
    paymentMode: 'CASH',
    collectedBy: '',
  });

  const handleTogglePayment = (enabled: boolean) => {
    setCollectPayment(enabled);
    if (enabled) {
      const data = { ...paymentData, amountCollected: finalAmount };
      setPaymentData(data);
      onPaymentDataChange(data);
    } else {
      onPaymentDataChange(null);
    }
  };

  const handlePaymentDataChange = (updates: Partial<PaymentData>) => {
    const updated = { ...paymentData, ...updates };
    setPaymentData(updated);
    onPaymentDataChange(updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const pendingAmount = finalAmount - paymentData.amountCollected;
  const paymentStatus = paymentData.amountCollected === 0 
    ? 'PENDING' 
    : paymentData.amountCollected >= finalAmount 
    ? 'PAID' 
    : 'PARTIAL';

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Collection</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Collect fee payment during admission (optional)
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Collect Payment
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={collectPayment}
              onChange={(e) => handleTogglePayment(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </div>
        </label>
      </div>

      {collectPayment && (
        <div className="space-y-6">
          {/* Amount Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Payable Amount
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(finalAmount)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount Collecting *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={paymentData.amountCollected || ''}
                  onChange={(e) => handlePaymentDataChange({ 
                    amountCollected: parseFloat(e.target.value) || 0 
                  })}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                  placeholder="0"
                  min="0"
                  max={finalAmount}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pending Amount
              </label>
              <div className={`px-4 py-3 rounded-lg ${
                pendingAmount > 0 
                  ? 'bg-orange-50 dark:bg-orange-900/20' 
                  : 'bg-green-50 dark:bg-green-900/20'
              }`}>
                <p className={`text-lg font-bold ${
                  pendingAmount > 0 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status:</span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              paymentStatus === 'PAID' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : paymentStatus === 'PARTIAL'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {paymentStatus === 'PAID' ? 'Fully Paid' : paymentStatus === 'PARTIAL' ? 'Partially Paid' : 'Pending'}
            </span>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Payment Mode *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PAYMENT_MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => handlePaymentDataChange({ paymentMode: mode.value as any })}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      paymentData.paymentMode === mode.value
                        ? 'border-primary bg-primary/10 dark:bg-primary/5'
                        : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      paymentData.paymentMode === mode.value
                        ? 'text-primary'
                        : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      paymentData.paymentMode === mode.value
                        ? 'text-primary'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {mode.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(paymentData.paymentMode === 'UPI' || paymentData.paymentMode === 'CARD' || paymentData.paymentMode === 'BANK_TRANSFER') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId || ''}
                  onChange={(e) => handlePaymentDataChange({ transactionId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                  placeholder="Enter transaction ID"
                />
              </div>
            )}

            {(paymentData.paymentMode === 'CHEQUE' || paymentData.paymentMode === 'DD') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {paymentData.paymentMode === 'CHEQUE' ? 'Cheque Number' : 'DD Number'} *
                  </label>
                  <input
                    type="text"
                    value={paymentData.referenceNumber || ''}
                    onChange={(e) => handlePaymentDataChange({ referenceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                    placeholder={`Enter ${paymentData.paymentMode === 'CHEQUE' ? 'cheque' : 'DD'} number`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={paymentData.bankName || ''}
                    onChange={(e) => handlePaymentDataChange({ bankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={paymentData.branchName || ''}
                    onChange={(e) => handlePaymentDataChange({ branchName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                    placeholder="Enter branch name"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Collected By *
              </label>
              <input
                type="text"
                value={paymentData.collectedBy}
                onChange={(e) => handlePaymentDataChange({ collectedBy: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                placeholder="Enter staff/admin name"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                value={paymentData.remarks || ''}
                onChange={(e) => handlePaymentDataChange({ remarks: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                rows={2}
                placeholder="Any additional notes about this payment"
              />
            </div>
          </div>

          {/* Warning for partial payment */}
          {pendingAmount > 0 && paymentData.amountCollected > 0 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-200">Partial Payment</h4>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                  Student will have a pending balance of {formatCurrency(pendingAmount)} after admission. 
                  This can be collected later from the student fee ledger.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {!collectPayment && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Payment collection is disabled. Fee will be marked as pending.
          </p>
        </div>
      )}
    </div>
  );
}
