'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookMarked,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Filter,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dropdown } from '@/components/ui/dropdown'

interface Subject {
  id: string
  name: string
  code: string
  description: string | null
  type: string
  color: string | null
  icon: string | null
  displayOrder: number
  creditsPerWeek: number
  isActive: boolean
  createdAt: string
  _count: {
    timetableSlots: number
  }
}

const subjectTypes = [
  { value: 'CORE', label: 'Core Subject' },
  { value: 'ELECTIVE', label: 'Elective' },
  { value: 'LANGUAGE', label: 'Language' },
  { value: 'PRACTICAL', label: 'Practical/Lab' },
  { value: 'ACTIVITY', label: 'Activity' },
]

const subjectColors = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#F97316', label: 'Orange' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#84CC16', label: 'Lime' },
]

const getTypeLabel = (type: string) => {
  return subjectTypes.find((t) => t.value === type)?.label || type
}

const getTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'CORE':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
    case 'ELECTIVE':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
    case 'LANGUAGE':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
    case 'PRACTICAL':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
    case 'ACTIVITY':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
  }
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'CORE',
    color: '#3B82F6',
    creditsPerWeek: 4,
    isActive: true,
  })

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/institution/subjects?activeOnly=false')
      const result = await response.json()
      if (result.success) {
        setSubjects(result.data)
      } else {
        setError(result.message || 'Failed to fetch subjects')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch subjects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filterType || subject.type === filterType
    return matchesSearch && matchesType
  })

  const openModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject)
      setFormData({
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        type: subject.type,
        color: subject.color || '#3B82F6',
        creditsPerWeek: subject.creditsPerWeek,
        isActive: subject.isActive,
      })
    } else {
      setEditingSubject(null)
      setFormData({
        name: '',
        code: '',
        description: '',
        type: 'CORE',
        color: '#3B82F6',
        creditsPerWeek: 4,
        isActive: true,
      })
    }
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSubject(null)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    try {
      const url = editingSubject
        ? `/api/institution/subjects/${editingSubject.id}`
        : '/api/institution/subjects'

      const response = await fetch(url, {
        method: editingSubject ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchSubjects()
      } else {
        setFormError(result.message || 'Failed to save subject')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setFormError('Failed to save subject')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/institution/subjects/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setDeleteConfirm(null)
        fetchSubjects()
      } else {
        setError(result.message || 'Failed to delete subject')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete subject')
    }
  }

  const toggleStatus = async (subject: Subject) => {
    try {
      const response = await fetch(`/api/institution/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !subject.isActive }),
      })

      const result = await response.json()

      if (result.success) {
        fetchSubjects()
      }
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Subjects
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage subjects for your institution
              </p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4" />
              Add Subject
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subjects..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg"
              />
            </div>
            <div className="w-48">
              <Dropdown
                options={[{ value: '', label: 'All Types' }, ...subjectTypes]}
                value={filterType}
                onChange={setFilterType}
                placeholder="Filter by type"
              />
            </div>
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
          ) : filteredSubjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookMarked className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || filterType ? 'No Subjects Found' : 'No Subjects Yet'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {searchQuery || filterType
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by adding subjects that will be taught in your institution.'}
              </p>
              {!searchQuery && !filterType && (
                <Button onClick={() => openModal()}>
                  <Plus className="w-4 h-4" />
                  Add Subject
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Subject
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Code
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Credits/Week
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="border-b border-gray-100 dark:border-dark-700 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-700/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs"
                            style={{ backgroundColor: subject.color || '#3B82F6' }}
                          >
                            {subject.code.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {subject.name}
                            </span>
                            {subject.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {subject.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          {subject.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadgeClass(
                            subject.type
                          )}`}
                        >
                          {getTypeLabel(subject.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {subject.creditsPerWeek}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(subject)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            subject.isActive ? 'bg-primary' : 'bg-gray-300 dark:bg-dark-600'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                              subject.isActive ? 'translate-x-5' : ''
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="xs" variant="outline" onClick={() => openModal(subject)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setDeleteConfirm(subject.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                            disabled={subject._count.timetableSlots > 0}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <div className="w-full max-w-lg bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingSubject ? 'Edit Subject' : 'Add Subject'}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="name" required className="text-xs">
                        Subject Name
                      </Label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="code" required className="text-xs">
                        Subject Code
                      </Label>
                      <input
                        id="code"
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg font-mono"
                        placeholder="e.g., MATH"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-xs">
                      Description (Optional)
                    </Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg resize-none"
                      placeholder="Brief description of the subject..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type" className="text-xs">
                        Subject Type
                      </Label>
                      <Dropdown
                        options={subjectTypes}
                        value={formData.type}
                        onChange={(val) => setFormData({ ...formData, type: val })}
                        placeholder="Select type"
                      />
                    </div>

                    <div>
                      <Label htmlFor="credits" className="text-xs">
                        Credits/Week
                      </Label>
                      <input
                        id="credits"
                        type="number"
                        value={formData.creditsPerWeek}
                        onChange={(e) =>
                          setFormData({ ...formData, creditsPerWeek: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        min={0}
                        max={20}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Color</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {subjectColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`w-8 h-8 rounded-lg transition-all ${
                            formData.color === color.value
                              ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white'
                              : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
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
                          {editingSubject ? 'Update' : 'Create'}
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
                  Delete Subject?
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  This will permanently remove this subject. This action cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
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

