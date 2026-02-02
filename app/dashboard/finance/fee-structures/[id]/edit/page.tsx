'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';

interface FeeStructure {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isLocked: boolean;
  academicYear: { name: string };
  academicUnit: { name: string } | null;
  components: Array<{
    id: string;
    name: string;
    feeType: string;
    amount: number;
    frequency: string;
    isMandatory: boolean;
    description: string | null;
  }>;
  _count: { studentFees: number };
}

interface FeeComponent {
  name: string;
  feeType: string;
  amount: number;
  frequency: string;
  isMandatory: boolean;
  description?: string;
}

const FEE_TYPES = [
  { value: 'TUITION', label: 'Tuition Fee' },
  { value: 'ADMISSION', label: 'Admission Fee' },
  { value: 'EXAMINATION', label: 'Exam Fee' },
  { value: 'LIBRARY', label: 'Library Fee' },
  { value: 'LABORATORY', label: 'Laboratory Fee' },
  { value: 'SPORTS', label: 'Sports Fee' },
  { value: 'TRANSPORT', label: 'Transport Fee' },
  { value: 'HOSTEL', label: 'Hostel Fee' },
  { value: 'UNIFORM', label: 'Uniform Fee' },
  { value: 'BOOKS', label: 'Books Fee' },
  { value: 'ACTIVITY', label: 'Activity Fee' },
  { value: 'DEVELOPMENT', label: 'Development Fee' },
  { value: 'OTHER', label: 'Other' },
];

const FREQUENCIES = [
  { value: 'ONE_TIME', label: 'One Time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half Yearly' },
  { value: 'ANNUAL', label: 'Annual' },
];

export default function EditFeeStructurePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [components, setComponents] = useState<FeeComponent[]>([]);
  const [originalData, setOriginalData] = useState<FeeStructure | null>(null);

  useEffect(() => {
    fetchFeeStructure();
  }, [params.id]);

  const fetchFeeStructure = async () => {
    try {
      const res = await fetch(`/api/institution/finance/fee-structures/${params.id}`);
      const data = await res.json();
      
      if (data.feeStructure) {
        const fs = data.feeStructure;
        setOriginalData(fs);
        setFormData({
          name: fs.name,
          description: fs.description || '',
          isActive: fs.isActive,
        });
        setComponents(fs.components.map((c: any) => ({
          name: c.name,
          feeType: c.feeType,
          amount: c.amount,
          frequency: c.frequency,
          isMandatory: c.isMandatory,
          description: c.description || '',
        })));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fee structure:', error);
      setLoading(false);
    }
  };

  const addComponent = () => {
    setComponents([...components, { 
      name: '', 
      feeType: 'OTHER', 
      amount: 0, 
      frequency: 'ANNUAL', 
      isMandatory: true 
    }]);
  };

  const removeComponent = (index: number) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const updateComponent = (index: number, field: keyof FeeComponent, value: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name) {
      setFormError('Please fill in all required fields');
      return;
    }

    const validComponents = components.filter(c => c.name && c.amount > 0);
    if (validComponents.length === 0) {
      setFormError('Please add at least one fee component with name and amount');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/institution/finance/fee-structures/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          components: validComponents
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update fee structure');
      }

      router.push(`/dashboard/finance/fee-structures/${params.id}`);
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalComponentAmount = components.reduce((sum, c) => sum + (c.amount || 0), 0);

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

  if (!originalData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="p-6 lg:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Fee Structure Not Found</h1>
              <button
                onClick={() => router.push('/dashboard/finance/fee-structures')}
                className="text-primary hover:text-primary/80"
              >
                Back to Fee Structures
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (originalData.isLocked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="p-6 lg:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cannot Edit Locked Fee Structure</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This fee structure is locked because students have been assigned to it.
              </p>
              <button
                onClick={() => router.push(`/dashboard/finance/fee-structures/${params.id}`)}
                className="text-primary hover:text-primary/80"
              >
                View Fee Structure
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/dashboard/finance/fee-structures/${params.id}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Fee Structure</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {originalData.academicYear.name} • {originalData.academicUnit?.name || 'All Classes'}
              </p>
            </div>
          </div>

          {/* Warning */}
          {originalData._count.studentFees > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> This fee structure is assigned to {originalData._count.studentFees} student(s). 
                Modifying fee components may affect existing student fee records.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
            <div className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200 text-sm">
                  {formError}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fee Structure Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Class 10 Fee Structure 2024-25"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Brief description of this fee structure"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active (Students can be assigned to this fee structure)
                    </span>
                  </label>
                </div>
              </div>

              {/* Fee Components */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Components</h3>
                  <button
                    type="button"
                    onClick={addComponent}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Component
                  </button>
                </div>

                <div className="space-y-4">
                  {components.map((component, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Component Name *
                          </label>
                          <input
                            type="text"
                            value={component.name}
                            onChange={(e) => updateComponent(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                            placeholder="e.g., Tuition Fee"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Type
                          </label>
                          <select
                            value={component.feeType}
                            onChange={(e) => updateComponent(index, 'feeType', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                          >
                            {FEE_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Amount (₹) *
                          </label>
                          <input
                            type="number"
                            value={component.amount || ''}
                            onChange={(e) => updateComponent(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                            placeholder="0"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Frequency
                          </label>
                          <select
                            value={component.frequency}
                            onChange={(e) => updateComponent(index, 'frequency', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                          >
                            {FREQUENCIES.map((freq) => (
                              <option key={freq.value} value={freq.value}>{freq.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={component.isMandatory}
                              onChange={(e) => updateComponent(index, 'isMandatory', e.target.checked)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Mandatory</span>
                          </label>
                          {components.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeComponent(index)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description field (full width) */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={component.description || ''}
                          onChange={(e) => updateComponent(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                          placeholder="Brief description of this fee component"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Total Fee Amount:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(totalComponentAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-dark-700">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/finance/fee-structures/${params.id}`)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
