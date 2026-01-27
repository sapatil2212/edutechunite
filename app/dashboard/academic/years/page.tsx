'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Star,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  isCurrent: boolean
  createdAt: string
  _count: {
    academicUnits: number
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: true,
    isCurrent: false,
  })

  const fetchYears = async () => {
    try {
      const response = await fetch('/api/institution/academic-years')
      const result = await response.json()
      if (result.success) {
        setYears(result.data)
      } else {
        setError(result.message || 'Failed to fetch academic years')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch academic years')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchYears()
  }, [])

  const openModal = (year?: AcademicYear) => {
    if (year) {
      setEditingYear(year)
      setFormData({
        name: year.name,
        startDate: year.startDate.split('T')[0],
        endDate: year.endDate.split('T')[0],
        isActive: year.isActive,
        isCurrent: year.isCurrent,
      })
    } else {
      setEditingYear(null)
      const currentYear = new Date().getFullYear()
      setFormData({
        name: `${currentYear}-${currentYear + 1}`,
        startDate: `${currentYear}-04-01`,
        endDate: `${currentYear + 1}-03-31`,
        isActive: true,
        isCurrent: false,
      })
    }
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingYear(null)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    try {
      const url = editingYear
        ? `/api/institution/academic-years/${editingYear.id}`
        : '/api/institution/academic-years'

      const response = await fetch(url, {
        method: editingYear ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchYears()
      } else {
        setFormError(result.message || 'Failed to save academic year')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setFormError('Failed to save academic year')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/institution/academic-years/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setDeleteConfirm(null)
        fetchYears()
      } else {
        setError(result.message || 'Failed to delete academic year')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete academic year')
    }
  }

  const handleSetCurrent = async (id: string) => {
    try {
      const response = await fetch(`/api/institution/academic-years/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCurrent: true }),
      })

      const result = await response.json()

      if (result.success) {
        fetchYears()
      }
    } catch (err) {
      console.error('Set current error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Academic Years
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your institution's academic years
              </p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4" />
              Add Academic Year
            </Button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          ) : years.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Academic Years
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Get started by creating your first academic year to organize classes and batches.
              </p>
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4" />
                Create Academic Year
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {years.map((year, index) => (
                <motion.div
                  key={year.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-dark-800 rounded-xl border p-5 relative ${
                    year.isCurrent
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-gray-200 dark:border-dark-700'
                  }`}
                >
                  {year.isCurrent && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Star className="w-4 h-4 text-dark-900 fill-current" />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {year.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(year.startDate)} - {formatDate(year.endDate)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        year.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {year.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Classes:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {year._count.academicUnits}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
                    {!year.isCurrent && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleSetCurrent(year.id)}
                        className="flex-1"
                      >
                        <Star className="w-3 h-3" />
                        Set Current
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => openModal(year)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setDeleteConfirm(year.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="name" required className="text-xs">
                      Academic Year Name
                    </Label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      placeholder="e.g., 2024-2025"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" required className="text-xs">
                        Start Date
                      </Label>
                      <input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" required className="text-xs">
                        End Date
                      </Label>
                      <input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isCurrent}
                        onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Set as Current</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {editingYear ? 'Update' : 'Create'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  Delete Academic Year?
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  This action cannot be undone. All associated data will be permanently removed.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

