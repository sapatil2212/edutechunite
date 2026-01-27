'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
  Users,
  Sparkles,
  LayoutGrid,
  List,
  BookOpen,
  Check,
  Square,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dropdown } from '@/components/ui/dropdown'

interface AcademicYear {
  id: string
  name: string
  isCurrent: boolean
}

interface Section {
  id: string
  name: string
  maxStudents: number
  currentStudents: number
  isActive: boolean
}

interface Subject {
  id: string
  name: string
  code: string
  type: string
  color: string | null
}

interface AcademicUnit {
  id: string
  name: string
  type: string
  maxStudents: number
  currentStudents: number
  isActive: boolean
  displayOrder: number
  academicYear: {
    id: string
    name: string
    isCurrent: boolean
  }
  children?: Section[]
  academicUnitSubjects?: {
    subject: Subject
  }[]
  _count: {
    children: number
  }
}

interface DefaultUnit {
  name: string
  displayOrder: number
  suggestedSections?: string[]
}

interface Defaults {
  type: string
  label: string
  units: DefaultUnit[]
  institutionType: string
  schoolType: string | null
}

export default function ClassesPage() {
  const [units, setUnits] = useState<AcademicUnit[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedYearId, setSelectedYearId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<AcademicUnit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedUnits, setExpandedUnits] = useState<string[]>([])
  
  // Defaults modal
  const [isDefaultsModalOpen, setIsDefaultsModalOpen] = useState(false)
  const [defaults, setDefaults] = useState<Defaults | null>(null)
  const [selectedDefaults, setSelectedDefaults] = useState<string[]>([])
  const [includeSections, setIncludeSections] = useState(true)
  
  // Subject selection states
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [allSubjectsSelected, setAllSubjectsSelected] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    academicYearId: '',
    type: 'CLASS',
    maxStudents: 40,
    hasSections: false,
    sections: [{ name: 'Section A', maxStudents: 40 }],
  })

  // Label based on defaults
  const unitLabel = defaults?.label || 'Classes / Batches'
  const unitSingular = defaults?.type === 'BATCH' ? 'Batch' : defaults?.type === 'SEMESTER' ? 'Semester' : 'Class'

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const response = await fetch('/api/institution/academic-years')
      const result = await response.json()
      if (result.success) {
        setAcademicYears(result.data)
        // Auto-select current year
        const currentYear = result.data.find((y: AcademicYear) => y.isCurrent)
        if (currentYear) {
          setSelectedYearId(currentYear.id)
        } else if (result.data.length > 0) {
          setSelectedYearId(result.data[0].id)
        }
      }
    } catch (err) {
      console.error('Fetch years error:', err)
    }
  }

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/institution/subjects?activeOnly=true')
      const result = await response.json()
      if (result.success) {
        setSubjects(result.data)
      }
    } catch (err) {
      console.error('Fetch subjects error:', err)
    }
  }

  // Fetch defaults
  const fetchDefaults = async () => {
    try {
      const response = await fetch('/api/institution/academic-units/defaults')
      const result = await response.json()
      if (result.success) {
        setDefaults(result.data)
      }
    } catch (err) {
      console.error('Fetch defaults error:', err)
    }
  }

  // Fetch academic units
  const fetchUnits = async () => {
    if (!selectedYearId) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/institution/academic-units?academicYearId=${selectedYearId}&parentId=null&includeChildren=true`
      )
      const result = await response.json()
      if (result.success) {
        setUnits(result.data)
      } else {
        setError(result.message || 'Failed to fetch classes')
      }
    } catch (err) {
      console.error('Fetch units error:', err)
      setError('Failed to fetch classes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAcademicYears()
    fetchDefaults()
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (selectedYearId) {
      fetchUnits()
    }
  }, [selectedYearId])

  const toggleExpand = (id: string) => {
    setExpandedUnits((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Subject selection helpers
  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  const toggleSelectAllSubjects = () => {
    if (allSubjectsSelected) {
      setSelectedSubjectIds([])
    } else {
      setSelectedSubjectIds(subjects.map(s => s.id))
    }
  }

  useEffect(() => {
    setAllSubjectsSelected(selectedSubjectIds.length === subjects.length && subjects.length > 0)
  }, [selectedSubjectIds, subjects])

  const openModal = (unit?: AcademicUnit) => {
    if (unit) {
      setEditingUnit(unit)
      setFormData({
        name: unit.name,
        academicYearId: unit.academicYear.id,
        type: unit.type,
        maxStudents: unit.maxStudents,
        hasSections: (unit._count?.children || 0) > 0,
        sections: unit.children?.map((s) => ({ name: s.name, maxStudents: s.maxStudents })) || [],
      })
      // Set selected subjects for editing
      const subjectIds = unit.academicUnitSubjects?.map(s => s.subject.id) || []
      setSelectedSubjectIds(subjectIds)
    } else {
      setEditingUnit(null)
      setFormData({
        name: '',
        academicYearId: selectedYearId,
        type: defaults?.type || 'CLASS',
        maxStudents: 40,
        hasSections: false,
        sections: [{ name: 'Section A', maxStudents: 40 }],
      })
      // Clear subject selection for new class
      setSelectedSubjectIds([])
    }
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUnit(null)
    setFormError('')
    setSelectedSubjectIds([])
    setAllSubjectsSelected(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    try {
      const url = editingUnit
        ? `/api/institution/academic-units/${editingUnit.id}`
        : '/api/institution/academic-units'

      const body = editingUnit
        ? {
            name: formData.name,
            maxStudents: formData.hasSections ? 0 : formData.maxStudents,
            subjectIds: selectedSubjectIds,
          }
        : {
            name: formData.name,
            academicYearId: formData.academicYearId,
            type: formData.type,
            maxStudents: formData.hasSections ? 0 : formData.maxStudents,
            hasSections: formData.hasSections,
            sections: formData.hasSections ? formData.sections : [],
            subjectIds: selectedSubjectIds,
          }

      const response = await fetch(url, {
        method: editingUnit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchUnits()
      } else {
        setFormError(result.message || 'Failed to save')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setFormError('Failed to save')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/institution/academic-units/${id}?hard=true`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setDeleteConfirm(null)
        fetchUnits()
      } else {
        setError(result.message || 'Failed to delete')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete')
    }
  }

  // Handle adding section
  const addSection = () => {
    const nextLetter = String.fromCharCode(65 + formData.sections.length)
    setFormData({
      ...formData,
      sections: [...formData.sections, { name: `Section ${nextLetter}`, maxStudents: 40 }],
    })
  }

  const removeSection = (index: number) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((_, i) => i !== index),
    })
  }

  const updateSection = (index: number, field: string, value: string | number) => {
    const newSections = [...formData.sections]
    newSections[index] = { ...newSections[index], [field]: value }
    setFormData({ ...formData, sections: newSections })
  }

  // Handle defaults
  const openDefaultsModal = () => {
    if (defaults && selectedYearId) {
      setSelectedDefaults(defaults.units.map((u) => u.name))
      setIsDefaultsModalOpen(true)
    }
  }

  const handleApplyDefaults = async () => {
    if (!defaults || selectedDefaults.length === 0) return

    setIsSubmitting(true)
    try {
      const selectedUnits = defaults.units.filter((u) => selectedDefaults.includes(u.name))

      const response = await fetch('/api/institution/academic-units/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: selectedYearId,
          units: selectedUnits,
          includeSections,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setIsDefaultsModalOpen(false)
        fetchUnits()
      } else {
        setFormError(result.message || 'Failed to apply defaults')
      }
    } catch (err) {
      console.error('Apply defaults error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTotalStudents = (unit: AcademicUnit): number => {
    if (unit.children && unit.children.length > 0) {
      return unit.children.reduce((sum, s) => sum + s.currentStudents, 0)
    }
    return unit.currentStudents
  }

  const getMaxStudents = (unit: AcademicUnit): number => {
    if (unit.children && unit.children.length > 0) {
      return unit.children.reduce((sum, s) => sum + s.maxStudents, 0)
    }
    return unit.maxStudents
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
                {unitLabel}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your academic structure and sections
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Academic Year Selector */}
              {academicYears.length > 0 && (
                <div className="w-48">
                  <Dropdown
                    options={academicYears.map((y) => ({
                      value: y.id,
                      label: `${y.name}${y.isCurrent ? ' (Current)' : ''}`,
                    }))}
                    value={selectedYearId}
                    onChange={setSelectedYearId}
                    placeholder="Select Year"
                  />
                </div>
              )}
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-dark-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-dark-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-dark-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              {defaults && units.length === 0 && selectedYearId && (
                <Button variant="outline" onClick={openDefaultsModal}>
                  <Sparkles className="w-4 h-4" />
                  Use Defaults
                </Button>
              )}
              <Button onClick={() => openModal()} disabled={!selectedYearId}>
                <Plus className="w-4 h-4" />
                Add {unitSingular}
              </Button>
            </div>
          </div>

          {/* No Academic Year Warning */}
          {academicYears.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Academic Year Found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                You need to create an academic year before adding {unitLabel.toLowerCase()}. Academic years help organize your classes by session.
              </p>
              <Button onClick={() => window.location.href = '/dashboard/academic/years'}>
                <Plus className="w-4 h-4" />
                Create Academic Year
              </Button>
            </motion.div>
          )}

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
          ) : units.length === 0 && selectedYearId ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No {unitLabel} Yet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Start by adding {unitSingular.toLowerCase()}es manually or use smart defaults based on your institution type.
              </p>
              <div className="flex items-center justify-center gap-3">
                {defaults && selectedYearId && (
                  <Button variant="outline" onClick={openDefaultsModal}>
                    <Sparkles className="w-4 h-4" />
                    Use Defaults
                  </Button>
                )}
                <Button onClick={() => openModal()} disabled={!selectedYearId}>
                  <Plus className="w-4 h-4" />
                  Add {unitSingular}
                </Button>
              </div>
            </motion.div>
          ) : !selectedYearId && academicYears.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select an Academic Year
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Please select an academic year from the dropdown above to view or manage {unitLabel.toLowerCase()}.
              </p>
            </motion.div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {units.map((unit, index) => (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`bg-white dark:bg-dark-800 rounded-xl border p-4 ${
                    unit.isActive
                      ? 'border-gray-200 dark:border-dark-700'
                      : 'border-gray-200 dark:border-dark-700 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {unit.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {unit._count.children > 0
                          ? `${unit._count.children} sections`
                          : 'No sections'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        unit.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {unit.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Students Count */}
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getTotalStudents(unit)} / {getMaxStudents(unit)} students
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min((getTotalStudents(unit) / getMaxStudents(unit)) * 100, 100)}%`,
                      }}
                    />
                  </div>

                  {/* Sections */}
                  {unit.children && unit.children.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => toggleExpand(unit.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {expandedUnits.includes(unit.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        View Sections
                      </button>
                      {expandedUnits.includes(unit.id) && (
                        <div className="mt-2 space-y-1.5">
                          {unit.children.map((section) => (
                            <div
                              key={section.id}
                              className="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-dark-700 rounded-lg text-xs"
                            >
                              <span className="text-gray-700 dark:text-gray-300">
                                {section.name}
                              </span>
                              <span className="text-gray-500">
                                {section.currentStudents}/{section.maxStudents}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
                    <Button size="xs" variant="outline" onClick={() => openModal(unit)} className="flex-1">
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setDeleteConfirm(unit.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Sections
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Students
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Capacity
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
                  {units.map((unit) => (
                    <tr
                      key={unit.id}
                      className="border-b border-gray-100 dark:border-dark-700 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-700/50"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {unit.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {unit._count.children || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {getTotalStudents(unit)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {getMaxStudents(unit)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            unit.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {unit.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="xs" variant="outline" onClick={() => openModal(unit)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setDeleteConfirm(unit.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
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
              <div className="w-full max-w-2xl bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700 sticky top-0 bg-white dark:bg-dark-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingUnit ? `Edit ${unitSingular}` : `Add ${unitSingular}`}
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

                  {/* Class Name - Full Width with smaller padding */}
                  <div>
                    <Label htmlFor="name" required className="text-xs">
                      {unitSingular} Name
                    </Label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      placeholder={`e.g., ${unitSingular} 1`}
                      required
                    />
                  </div>

                  {!editingUnit && (
                    <>
                      {/* Academic Year and Max Students - Side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="academicYear" required className="text-xs">
                            Academic Year
                          </Label>
                          <Dropdown
                            options={academicYears.map((y) => ({
                              value: y.id,
                              label: y.name,
                            }))}
                            value={formData.academicYearId}
                            onChange={(val) => setFormData({ ...formData, academicYearId: val })}
                            placeholder="Select Academic Year"
                            className="text-sm"
                          />
                        </div>

                        {!formData.hasSections && (
                          <div>
                            <Label htmlFor="maxStudents" className="text-xs">
                              Max Students
                            </Label>
                            <input
                              id="maxStudents"
                              type="number"
                              value={formData.maxStudents}
                              onChange={(e) =>
                                setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 0 })
                              }
                              className="w-full px-2.5 py-1.5 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                              min={1}
                            />
                          </div>
                        )}
                      </div>

                      {/* Has Sections Toggle - Reduced padding */}
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Has Sections?
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Divide into sections like A, B, C
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, hasSections: !formData.hasSections })
                          }
                          className={`relative w-9 h-5 rounded-full transition-colors ${
                            formData.hasSections ? 'bg-primary' : 'bg-gray-300 dark:bg-dark-600'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                              formData.hasSections ? 'translate-x-4' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Sections - Smaller fields */}
                      {formData.hasSections && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Sections</Label>
                            <Button type="button" size="xs" variant="outline" onClick={addSection} className="text-xs px-2 py-1">
                              <Plus className="w-3 h-3" />
                              Add Section
                            </Button>
                          </div>
                          {formData.sections.map((section, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={section.name}
                                onChange={(e) => updateSection(index, 'name', e.target.value)}
                                className="flex-1 px-2.5 py-1.5 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                                placeholder="Section name"
                              />
                              <input
                                type="number"
                                value={section.maxStudents}
                                onChange={(e) =>
                                  updateSection(index, 'maxStudents', parseInt(e.target.value) || 0)
                                }
                                className="w-16 px-2.5 py-1.5 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                                placeholder="Max"
                                min={1}
                              />
                              {formData.sections.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSection(index)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Subject Allocation */}
                  <div className="border-t border-gray-200 dark:border-dark-700 pt-4">
                    <Label className="text-xs mb-3 block">Allocate Subjects</Label>
                    {subjects.length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No subjects available</p>
                        <Button 
                          type="button" 
                          size="xs" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => window.location.href = '/dashboard/academic/subjects'}
                        >
                          Create Subjects
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Select All Toggle */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={toggleSelectAllSubjects}
                              className={`w-5 h-5 rounded border flex items-center justify-center ${
                                allSubjectsSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-gray-300 dark:border-dark-600'
                              }`}
                            >
                              {allSubjectsSelected && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Select All Subjects
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedSubjectIds.length} of {subjects.length} selected
                          </span>
                        </div>

                        {/* Subject List */}
                        <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-900">
                          {subjects.map((subject) => (
                            <label
                              key={subject.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer border-b border-gray-100 dark:border-dark-700 last:border-0"
                            >
                              <button
                                type="button"
                                onClick={() => toggleSubjectSelection(subject.id)}
                                className={`w-5 h-5 rounded border flex items-center justify-center ${
                                  selectedSubjectIds.includes(subject.id)
                                    ? 'bg-primary border-primary'
                                    : 'border-gray-300 dark:border-dark-600'
                                }`}
                              >
                                {selectedSubjectIds.includes(subject.id) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white truncate">
                                    {subject.name}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full">
                                    {subject.code}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    subject.type === 'CORE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    subject.type === 'ELECTIVE' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                    subject.type === 'LANGUAGE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    subject.type === 'PRACTICAL' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                    {subject.type}
                                  </span>
                                  {subject.color && (
                                    <div 
                                      className="w-3 h-3 rounded-full border border-gray-200" 
                                      style={{ backgroundColor: subject.color }}
                                    />
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {editingUnit && !editingUnit._count?.children && (
                    <div>
                      <Label htmlFor="maxStudents" className="text-xs">
                        Max Students
                      </Label>
                      <input
                        id="maxStudents"
                        type="number"
                        value={formData.maxStudents}
                        onChange={(e) =>
                          setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        min={1}
                      />
                    </div>
                  )}

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
                          {editingUnit ? 'Update' : 'Create'}
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

      {/* Defaults Modal */}
      <AnimatePresence>
        {isDefaultsModalOpen && defaults && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDefaultsModalOpen(false)}
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Smart Defaults
                      </h2>
                      <p className="text-xs text-gray-500">
                        Based on your {defaults.institutionType.toLowerCase()} type
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDefaultsModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select the {defaults.label.toLowerCase()} you want to create:
                  </p>

                  <div className="space-y-2">
                    {defaults.units.map((unit) => (
                      <label
                        key={unit.name}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDefaults.includes(unit.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDefaults([...selectedDefaults, unit.name])
                            } else {
                              setSelectedDefaults(selectedDefaults.filter((n) => n !== unit.name))
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {unit.name}
                        </span>
                        {unit.suggestedSections && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({unit.suggestedSections.length} sections)
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSections}
                      onChange={(e) => setIncludeSections(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Include suggested sections
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Automatically create sections (A, B, C...) for each class
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-dark-700">
                  <Button
                    variant="outline"
                    onClick={() => setIsDefaultsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApplyDefaults}
                    disabled={isSubmitting || selectedDefaults.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Create {selectedDefaults.length} {defaults.label}
                      </>
                    )}
                  </Button>
                </div>
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
                  Delete {unitSingular}?
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  This will permanently remove this {unitSingular.toLowerCase()} and all its sections.
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700">
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

