'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { ArrowLeft, Edit, Trash2, Lock, Calendar, Users, DollarSign, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeeStructure {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  academicYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  academicUnit: {
    id: string;
    name: string;
    type: string;
  } | null;
  components: Array<{
    id: string;
    name: string;
    feeType: string;
    amount: number;
    frequency: string;
    isMandatory: boolean;
    description: string | null;
    allowPartialPayment: boolean;
    lateFeeApplicable: boolean;
    lateFeeAmount: number | null;
    lateFeePercentage: number | null;
  }>;
  _count: {
    studentFees: number;
  };
}

export default function ViewFeeStructurePage() {
  const params = useParams();
  const router = useRouter();
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchFeeStructure();
  }, [params.id]);

  const fetchFeeStructure = async () => {
    try {
      const res = await fetch(`/api/institution/finance/fee-structures/${params.id}`);
      const data = await res.json();
      if (data.feeStructure) {
        setFeeStructure(data.feeStructure);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fee structure:', error);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/institution/finance/fee-structures/${params.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        router.push('/dashboard/finance/fee-structures');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete fee structure');
      }
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      alert('Failed to delete fee structure');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    );
  }

  if (!feeStructure) {
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

  const totalAmount = feeStructure.components.reduce((sum, comp) => sum + comp.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />
      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/finance/fee-structures')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{feeStructure.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Fee Structure Details</p>
              </div>
            </div>
            <div className="flex gap-3">
              {!feeStructure.isLocked && (
                <>
                  <button
                    onClick={() => router.push(`/dashboard/finance/fee-structures/${params.id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    <Edit className="w-5 h-5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              feeStructure.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
              {feeStructure.isActive ? 'Active' : 'Inactive'}
            </span>
            {feeStructure.isLocked && (
              <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-sm font-medium rounded-full">
                <Lock className="w-4 h-4" />
                Locked
              </span>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Academic Year</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{feeStructure.academicYear.name}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Class/Section</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {feeStructure.academicUnit?.name || 'All Classes'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Students Assigned</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{feeStructure._count.studentFees}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {feeStructure.description && (
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
              <p className="text-gray-600 dark:text-gray-400">{feeStructure.description}</p>
            </div>
          )}

          {/* Fee Components */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
            <div className="p-6 border-b border-gray-100 dark:border-dark-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fee Components</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {feeStructure.components.length} component{feeStructure.components.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {feeStructure.components.map((component) => (
                  <div key={component.id} className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{component.name}</h3>
                          {component.isMandatory && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium rounded">
                              Mandatory
                            </span>
                          )}
                        </div>
                        {component.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{component.description}</p>
                        )}
                        <div className="flex items-center gap-6 mt-3 text-sm text-gray-600 dark:text-gray-400">
                          <span>Type: <span className="font-medium text-gray-900 dark:text-white">{component.feeType}</span></span>
                          <span>Frequency: <span className="font-medium text-gray-900 dark:text-white">{component.frequency}</span></span>
                          {component.allowPartialPayment && (
                            <span className="text-green-600 dark:text-green-400">Partial Payment Allowed</span>
                          )}
                        </div>
                        {component.lateFeeApplicable && (
                          <div className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                            Late Fee: {component.lateFeeAmount ? formatCurrency(component.lateFeeAmount) : `${component.lateFeePercentage}%`}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(component.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Fee Amount:</span>
                  <span className="text-3xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Created On</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatDate(feeStructure.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Academic Year Period</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatDate(feeStructure.academicYear.startDate)} - {formatDate(feeStructure.academicYear.endDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <div
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                  Delete Fee Structure?
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  {feeStructure._count.studentFees > 0
                    ? 'This fee structure has assigned students and cannot be deleted. Please deactivate it instead.'
                    : 'This will permanently remove this fee structure and all its components. This action cannot be undone.'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={feeStructure._count.studentFees > 0}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
