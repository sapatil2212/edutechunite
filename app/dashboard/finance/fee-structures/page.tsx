'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { Plus, Edit, Trash2, Lock, Eye, Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeeStructure {
  id: string;
  name: string;
  description: string;
  academicYear: { id: string; name: string };
  academicUnit: { id: string; name: string } | null;
  isActive: boolean;
  isLocked: boolean;
  components: any[];
  _count: { studentFees: number };
  createdAt: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface AcademicUnit {
  id: string;
  name: string;
  type: string;
  parentId?: string | null;
  _count?: { children: number };
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
  { value: 'EXAM', label: 'Exam Fee' },
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

export default function FeeStructuresPage() {
  const { data: session } = useSession();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create form state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<AcademicUnit[]>([]);
  const [sections, setSections] = useState<AcademicUnit[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
  });
  const [applyToAllSections, setApplyToAllSections] = useState(false);
  const [components, setComponents] = useState<FeeComponent[]>([
    { name: '', feeType: 'TUITION', amount: 0, frequency: 'ANNUAL', isMandatory: true }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchFeeStructures();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (formData.academicYearId) {
      fetchClasses(formData.academicYearId);
    }
  }, [formData.academicYearId]);

  useEffect(() => {
    if (formData.classId && !applyToAllSections) {
      fetchSections(formData.classId);
    } else {
      setSections([]);
      setFormData(prev => ({ ...prev, sectionId: '' }));
    }
  }, [formData.classId, applyToAllSections]);

  const fetchFeeStructures = async () => {
    try {
      const res = await fetch('/api/institution/finance/fee-structures');
      const data = await res.json();
      setFeeStructures(data.feeStructures || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch('/api/institution/academic-years');
      const result = await res.json();
      // API returns { success: true, data: [...] }
      if (result.success && result.data) {
        setAcademicYears(result.data);
      } else if (result.academicYears) {
        setAcademicYears(result.academicYears);
      } else {
        setAcademicYears([]);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchClasses = async (academicYearId: string) => {
    try {
      const res = await fetch(`/api/institution/academic-units?academicYearId=${academicYearId}&parentId=null&type=CLASS`);
      const result = await res.json();
      if (result.success && result.data) {
        setClasses(result.data);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await fetch(`/api/institution/academic-units?parentId=${classId}`);
      const result = await res.json();
      if (result.success && result.data) {
        setSections(result.data);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const addComponent = () => {
    setComponents([...components, { name: '', feeType: 'OTHER', amount: 0, frequency: 'ANNUAL', isMandatory: true }]);
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || !formData.academicYearId) {
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
      const res = await fetch('/api/institution/finance/fee-structures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          academicYearId: formData.academicYearId,
          academicUnitId: applyToAllSections ? formData.classId : (formData.sectionId || formData.classId),
          components: validComponents
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create fee structure');
      }

      setShowCreateModal(false);
      setFormData({ name: '', description: '', academicYearId: '', classId: '', sectionId: '' });
      setApplyToAllSections(false);
      setComponents([{ name: '', feeType: 'TUITION', amount: 0, frequency: 'ANNUAL', isMandatory: true }]);
      fetchFeeStructures();
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/institution/finance/fee-structures/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setDeleteConfirm(null);
        fetchFeeStructures();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete fee structure');
      }
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      alert('Failed to delete fee structure');
    }
  };

  const filteredStructures = feeStructures.filter(fs =>
    fs.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fs.academicYear.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />
      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fee Structures</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage fee structures for different classes and courses</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Fee Structure
            </button>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-dark-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search fee structures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Fee Structures List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredStructures.length === 0 ? (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-dark-700">
                <p className="text-gray-500 dark:text-gray-400">No fee structures found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-primary hover:text-primary/80 font-medium"
                >
                  Create your first fee structure
                </button>
              </div>
            ) : (
              filteredStructures.map((structure) => {
                const totalAmount = structure.components.reduce((sum, comp) => sum + comp.amount, 0);
                
                return (
                  <div key={structure.id} className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-700 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{structure.name}</h3>
                          {structure.isLocked && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            structure.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {structure.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {structure.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-2">{structure.description}</p>
                        )}
                        
                        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Academic Year: <span className="font-medium text-gray-900 dark:text-white">{structure.academicYear.name}</span></span>
                          {structure.academicUnit && (
                            <span>Class: <span className="font-medium text-gray-900 dark:text-white">{structure.academicUnit.name}</span></span>
                          )}
                          <span>Components: <span className="font-medium text-gray-900 dark:text-white">{structure.components.length}</span></span>
                          <span>Students: <span className="font-medium text-gray-900 dark:text-white">{structure._count.studentFees}</span></span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Fee Amount:</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => window.location.href = `/dashboard/finance/fee-structures/${structure.id}`}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {!structure.isLocked && (
                          <>
                            <button
                              onClick={() => window.location.href = `/dashboard/finance/fee-structures/${structure.id}/edit`}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(structure.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fee Components Preview */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {structure.components.slice(0, 4).map((component) => (
                        <div key={component.id} className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400">{component.name}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {formatCurrency(component.amount)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{component.frequency}</p>
                        </div>
                      ))}
                      {structure.components.length > 4 && (
                        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 flex items-center justify-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">+{structure.components.length - 4} more</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Create Fee Structure Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Fee Structure</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Define fee components for a class or course</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200 text-sm">
                  {formError}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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
                    Academic Year *
                  </label>
                  <select
                    value={formData.academicYearId}
                    onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Class *
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value, sectionId: '' })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls._count && cls._count.children > 0 ? `(${cls._count.children} sections)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={applyToAllSections}
                      onChange={(e) => setApplyToAllSections(e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      disabled={!formData.classId}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apply to All Sections
                    </span>
                  </label>
                  <select
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!formData.classId || applyToAllSections}
                  >
                    <option value="">
                      {!formData.classId ? 'Select class first' : sections.length === 0 ? 'No sections available' : 'Select Section'}
                    </option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                  {formData.classId && sections.length === 0 && !applyToAllSections && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      This class has no sections. Fee structure will apply to the entire class.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="Brief description of this fee structure"
                  />
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
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Total Fee Amount:</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(totalComponentAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                      Creating...
                    </>
                  ) : (
                    'Create Fee Structure'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <div
              onClick={() => setDeleteConfirm(null)}
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
                  {feeStructures.find(fs => fs.id === deleteConfirm)?._count.studentFees > 0
                    ? 'This fee structure has assigned students and cannot be deleted. Please deactivate it instead.'
                    : 'This will permanently remove this fee structure and all its components. This action cannot be undone.'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={feeStructures.find(fs => fs.id === deleteConfirm)?._count.studentFees > 0}
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
