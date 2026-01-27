'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  Calendar,
  Layers,
  Users,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  Save,
  Send,
  Eye,
  Edit3,
  Trash2,
  FileText,
  Info,
  Sliders,
} from 'lucide-react'
import Link from 'next/link'
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

interface AcademicUnit {
  id: string
  name: string
  parent?: { id: string; name: string } | null
  children?: { id: string; name: string }[]
  _count?: { children: number }
}

interface Subject {
  id: string
  name: string
  code: string
  color: string | null
  type: string
  creditsPerWeek: number
}

interface Teacher {
  id: string
  fullName: string
  employeeId: string
  maxPeriodsPerDay: number
  maxPeriodsPerWeek: number
  subjectAssignments: {
    subject: { id: string; name: string; code: string }
  }[]
}

interface PeriodTiming {
  id: string
  periodNumber: number
  name: string
  startTime: string
  endTime: string
  isBreak: boolean
}

interface TimetableTemplate {
  id: string
  name: string
  description: string | null
  periodsPerDay: number
  periodDuration: number
  workingDays: string[]
  isDefault: boolean
  isActive: boolean
  periodTimings: PeriodTiming[]
}

interface Timetable {
  id: string
  version: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt: string | null
  notes: string | null
  template: TimetableTemplate
  academicUnit: AcademicUnit & { academicYear: AcademicYear }
  slots: TimetableSlot[]
}

interface TimetableSlot {
  id: string
  dayOfWeek: string
  periodNumber: number
  slotType: string
  subjectId: string | null
  subject: {
    id: string
    name: string
    code: string
    color: string | null
    type: string
  } | null
  teacherId: string | null
  teacher: {
    id: string
    fullName: string
    employeeId: string
  } | null
  room: string | null
  notes: string | null
}

interface Conflict {
  type: string
  message: string
  details?: any
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

const getDayLabel = (day: string) => day.charAt(0) + day.slice(1).toLowerCase()
const getDayShort = (day: string) => day.slice(0, 3)

const getSlotTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    REGULAR: 'Regular Period',
    BREAK: 'Break',
    FREE: 'Free Period',
    ASSEMBLY: 'Assembly',
    ACTIVITY: 'Activity',
    LAB: 'Lab/Practical',
    COMBINED: 'Combined Class',
    SPECIAL: 'Special Event',
  }
  return labels[type] || type
}

export default function TimetablePage() {
  // Data states
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [templates, setTemplates] = useState<TimetableTemplate[]>([])
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [currentTimetable, setCurrentTimetable] = useState<Timetable | null>(null)

  // Selection states
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [view, setView] = useState<'list' | 'edit'>('list')

  // Modal states
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; period: number; timing: PeriodTiming } | null>(null)
  const [slotForm, setSlotForm] = useState({
    subjectId: '',
    teacherId: '',
    slotType: 'REGULAR',
    room: '',
    notes: '',
  })
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    periodsPerDay: 8,
    periodDuration: 45,
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    isDefault: false,
  })
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchInitialData()
  }, [])

  // Fetch academic units when year changes
  useEffect(() => {
    if (selectedYearId) {
      fetchAcademicUnits()
    }
  }, [selectedYearId])

  const fetchInitialData = async () => {
    try {
      const [yearsRes, subjectsRes, teachersRes, templatesRes] = await Promise.all([
        fetch('/api/institution/academic-years'),
        fetch('/api/institution/subjects'),
        fetch('/api/institution/teachers'),
        fetch('/api/institution/timetable/templates'),
      ])

      const [yearsData, subjectsData, teachersData, templatesData] = await Promise.all([
        yearsRes.json(),
        subjectsRes.json(),
        teachersRes.json(),
        templatesRes.json(),
      ])

      if (yearsData.success) {
        setAcademicYears(yearsData.data || [])
        const currentYear = yearsData.data?.find((y: AcademicYear) => y.isCurrent)
        if (currentYear) setSelectedYearId(currentYear.id)
        else if (yearsData.data?.length > 0) setSelectedYearId(yearsData.data[0].id)
      }

      if (subjectsData.success) setSubjects(subjectsData.data || [])
      if (teachersData.success) setTeachers(teachersData.data || [])
      if (templatesData.success) {
        setTemplates(templatesData.data || [])
        const defaultTemplate = templatesData.data?.find((t: TimetableTemplate) => t.isDefault)
        if (defaultTemplate) setSelectedTemplateId(defaultTemplate.id)
        else if (templatesData.data?.length > 0) setSelectedTemplateId(templatesData.data[0].id)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAcademicUnits = async () => {
    try {
      const response = await fetch(
        `/api/institution/academic-units?academicYearId=${selectedYearId}&parentId=null&includeChildren=true`
      )
      const data = await response.json()
      if (data.success) {
        setAcademicUnits(data.data || [])
      }
    } catch (err) {
      console.error('Fetch units error:', err)
    }
  }

  const fetchTimetables = async () => {
    if (!selectedUnitId) return
    try {
      const response = await fetch(`/api/institution/timetable?academicUnitId=${selectedUnitId}`)
      const data = await response.json()
      if (data.success) {
        setTimetables(data.data || [])
      }
    } catch (err) {
      console.error('Fetch timetables error:', err)
    }
  }

  useEffect(() => {
    if (selectedUnitId) {
      fetchTimetables()
    }
  }, [selectedUnitId])

  const createOrLoadTimetable = async () => {
    if (!selectedTemplateId || !selectedUnitId) {
      setError('Please select a template and class')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/institution/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          academicUnitId: selectedUnitId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Fetch the complete timetable with slots
        const timetableRes = await fetch(`/api/institution/timetable/${result.data.id}`)
        const timetableData = await timetableRes.json()

        if (timetableData.success) {
          setCurrentTimetable(timetableData.data)
          setView('edit')
        }
      } else {
        setError(result.message || 'Failed to create timetable')
      }
    } catch (err) {
      console.error('Create timetable error:', err)
      setError('Failed to create timetable')
    } finally {
      setIsSaving(false)
    }
  }

  const loadTimetable = async (id: string) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/institution/timetable/${id}`)
      const data = await response.json()

      if (data.success) {
        setCurrentTimetable(data.data)
        setView('edit')
      }
    } catch (err) {
      console.error('Load timetable error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const openSlotModal = async (day: string, period: number, timing: PeriodTiming) => {
    if (timing.isBreak) return

    setSelectedSlot({ day, period, timing })
    setConflicts([])

    // Find existing slot
    const existingSlot = currentTimetable?.slots.find(
      (s) => s.dayOfWeek === day && s.periodNumber === period
    )

    setSlotForm({
      subjectId: existingSlot?.subjectId || '',
      teacherId: existingSlot?.teacherId || '',
      slotType: existingSlot?.slotType || 'REGULAR',
      room: existingSlot?.room || '',
      notes: existingSlot?.notes || '',
    })

    // Fetch available teachers
    try {
      const response = await fetch(
        `/api/institution/timetable/slots?getAvailableTeachers=true&dayOfWeek=${day}&periodNumber=${period}`
      )
      const data = await response.json()
      if (data.success) {
        setAvailableTeachers(data.data || [])
      }
    } catch (err) {
      console.error('Fetch available teachers error:', err)
    }

    setIsSlotModalOpen(true)
  }

  const handleSaveSlot = async () => {
    if (!currentTimetable || !selectedSlot) return

    setIsSaving(true)
    setConflicts([])

    try {
      const response = await fetch('/api/institution/timetable/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetableId: currentTimetable.id,
          dayOfWeek: selectedSlot.day,
          periodNumber: selectedSlot.period,
          ...slotForm,
          subjectId: slotForm.subjectId || null,
          teacherId: slotForm.teacherId || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh timetable
        await loadTimetable(currentTimetable.id)
        setIsSlotModalOpen(false)
        setSuccessMessage('Slot saved successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else if (result.conflicts) {
        setConflicts(result.conflicts)
      } else {
        setError(result.message || 'Failed to save slot')
      }
    } catch (err) {
      console.error('Save slot error:', err)
      setError('Failed to save slot')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveSlot = async () => {
    if (!currentTimetable || !selectedSlot) return

    const existingSlot = currentTimetable.slots.find(
      (s) => s.dayOfWeek === selectedSlot.day && s.periodNumber === selectedSlot.period
    )
    if (!existingSlot) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/institution/timetable/slots?id=${existingSlot.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await loadTimetable(currentTimetable.id)
        setIsSlotModalOpen(false)
      }
    } catch (err) {
      console.error('Remove slot error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!currentTimetable) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/institution/timetable/${currentTimetable.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      })

      const result = await response.json()

      if (result.success) {
        setCurrentTimetable({ ...currentTimetable, status: 'PUBLISHED' })
        setIsPublishModalOpen(false)
        setSuccessMessage('Timetable published successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      console.error('Publish error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/institution/timetable/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      })

      const result = await response.json()

      if (result.success) {
        setIsTemplateModalOpen(false)
        setTemplates([result.data, ...templates])
        setSelectedTemplateId(result.data.id)
        setTemplateForm({
          name: '',
          description: '',
          periodsPerDay: 8,
          periodDuration: 45,
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
          isDefault: false,
        })
      }
    } catch (err) {
      console.error('Create template error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const getSlot = (day: string, periodNumber: number): TimetableSlot | undefined => {
    if (!currentTimetable?.slots || !Array.isArray(currentTimetable.slots)) return undefined
    return currentTimetable.slots.find((s) => s.dayOfWeek === day && s.periodNumber === periodNumber)
  }

  // Get unit options with parent names
  const unitOptions = academicUnits.flatMap((unit) => {
    if (unit.children && unit.children.length > 0) {
      return unit.children.map((section) => ({
        value: section.id,
        label: `${unit.name} - ${section.name}`,
      }))
    }
    return [{ value: unit.id, label: unit.name }]
  })

  // Calculate subject distribution
  const getSubjectStats = () => {
    if (!currentTimetable) return []

    const counts = new Map<string, number>()
    currentTimetable.slots
      .filter((s) => s.slotType === 'REGULAR' && s.subjectId)
      .forEach((s) => {
        counts.set(s.subjectId!, (counts.get(s.subjectId!) || 0) + 1)
      })

    return subjects.map((subject) => ({
      ...subject,
      current: counts.get(subject.id) || 0,
      status:
        (counts.get(subject.id) || 0) < subject.creditsPerWeek
          ? 'under'
          : (counts.get(subject.id) || 0) > subject.creditsPerWeek
          ? 'over'
          : 'ok',
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 right-6 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
                <button onClick={() => setError('')} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {view === 'list' ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Timetable Management
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create and manage class schedules
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/dashboard/academic/timetable/templates">
                    <Button variant="outline">
                      <Sliders className="w-4 h-4" />
                      Manage Templates
                    </Button>
                  </Link>
                  {templates.length === 0 && (
                    <Button onClick={() => setIsTemplateModalOpen(true)}>
                      <Plus className="w-4 h-4" />
                      New Template
                    </Button>
                  )}
                </div>
              </div>

              {templates.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Timetable Template
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    Create a template to define periods, timings, and working days.
                  </p>
                  <Button onClick={() => setIsTemplateModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Create Template
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Panel - Selection */}
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                        Create / Edit Timetable
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs mb-1 block">Academic Year</Label>
                          <Dropdown
                            options={academicYears.map((y) => ({ value: y.id, label: y.name }))}
                            value={selectedYearId}
                            onChange={setSelectedYearId}
                            placeholder="Select Year"
                          />
                        </div>

                        <div>
                          <Label className="text-xs mb-1 block">Class / Section</Label>
                          <Dropdown
                            options={unitOptions}
                            value={selectedUnitId}
                            onChange={setSelectedUnitId}
                            placeholder="Select Class"
                            searchable
                          />
                        </div>

                        <div>
                          <Label className="text-xs mb-1 block">Template</Label>
                          <Dropdown
                            options={templates.map((t) => ({ value: t.id, label: t.name }))}
                            value={selectedTemplateId}
                            onChange={setSelectedTemplateId}
                            placeholder="Select Template"
                          />
                        </div>

                        <Button
                          onClick={createOrLoadTimetable}
                          disabled={!selectedYearId || !selectedUnitId || !selectedTemplateId || isSaving}
                          className="w-full"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                          Open Editor
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Quick Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{templates.length}</p>
                          <p className="text-xs text-gray-500">Templates</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{teachers.length}</p>
                          <p className="text-xs text-gray-500">Teachers</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{subjects.length}</p>
                          <p className="text-xs text-gray-500">Subjects</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{academicUnits.length}</p>
                          <p className="text-xs text-gray-500">Classes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Timetable List */}
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {selectedUnitId ? 'Timetables for Selected Class' : 'Recent Timetables'}
                        </h3>
                      </div>

                      {timetables.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">
                            {selectedUnitId
                              ? 'No timetables for this class yet'
                              : 'Select a class to view timetables'}
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-dark-700">
                          {timetables.map((tt) => (
                            <div
                              key={tt.id}
                              className="p-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {tt.academicUnit.parent
                                        ? `${tt.academicUnit.parent.name} - ${tt.academicUnit.name}`
                                        : tt.academicUnit.name}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                        tt.status === 'PUBLISHED'
                                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                          : tt.status === 'DRAFT'
                                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                                          : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
                                      }`}
                                    >
                                      {tt.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Version {tt.version} • {tt.template.name}
                                  </p>
                                </div>
                                <Button size="xs" variant="outline" onClick={() => loadTimetable(tt.id)}>
                                  <Eye className="w-3 h-3" />
                                  {tt.status === 'DRAFT' ? 'Edit' : 'View'}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : currentTimetable ? (
            <>
              {/* Editor View */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setView('list')}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentTimetable.academicUnit.parent
                        ? `${currentTimetable.academicUnit.parent.name} - ${currentTimetable.academicUnit.name}`
                        : currentTimetable.academicUnit.name}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentTimetable.template.name} • Version {currentTimetable.version}
                      <span
                        className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                          currentTimetable.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                        }`}
                      >
                        {currentTimetable.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentTimetable.status === 'DRAFT' && (
                    <Button onClick={() => setIsPublishModalOpen(true)}>
                      <Send className="w-4 h-4" />
                      Publish
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Timetable Grid */}
                <div className="xl:col-span-3">
                  {/* Warning if template has limited working days */}
                  {currentTimetable.template.workingDays.length < 5 && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                        <AlertTriangle className="w-4 h-4" />
                        <p className="text-sm">
                          This template only has {currentTimetable.template.workingDays.length} working day(s): {(currentTimetable.template.workingDays as string[]).map(d => getDayLabel(d)).join(', ')}. 
                          <Link href="/dashboard/academic/timetable/templates" className="underline ml-1">
                            Edit template
                          </Link> to add more days.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-dark-700">
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-28 bg-gray-50 dark:bg-dark-700">
                              Period
                            </th>
                            {(currentTimetable.template.workingDays as string[]).map((day) => (
                              <th
                                key={day}
                                className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700"
                              >
                                {getDayLabel(day)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentTimetable.template.periodTimings.map((period) => (
                            <tr
                              key={period.periodNumber}
                              className={`border-b border-gray-100 dark:border-dark-700 ${
                                period.isBreak ? 'bg-gray-50 dark:bg-dark-700/50' : ''
                              }`}
                            >
                              <td className="px-3 py-2 border-r border-gray-100 dark:border-dark-700">
                                <div className="text-xs font-medium text-gray-900 dark:text-white">
                                  {period.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {period.startTime} - {period.endTime}
                                </div>
                              </td>
                              {(currentTimetable.template.workingDays as string[]).map((day) => {
                                if (period.isBreak) {
                                  return (
                                    <td
                                      key={day}
                                      className="px-2 py-2 text-center text-xs text-gray-400 dark:text-gray-500 italic"
                                    >
                                      Break
                                    </td>
                                  )
                                }

                                const slot = getSlot(day, period.periodNumber)

                                return (
                                  <td key={day} className="px-2 py-2">
                                    <button
                                      onClick={() => openSlotModal(day, period.periodNumber, period)}
                                      disabled={currentTimetable.status === 'PUBLISHED'}
                                      className={`w-full min-h-[70px] rounded-lg border-2 transition-all flex flex-col items-center justify-center p-2 ${
                                        slot?.subject
                                          ? 'border-transparent'
                                          : 'border-dashed border-gray-300 dark:border-dark-500 hover:border-primary hover:bg-primary/5 bg-gray-50 dark:bg-dark-700/30'
                                      } ${currentTimetable.status === 'PUBLISHED' ? 'cursor-default' : 'cursor-pointer'}`}
                                      style={
                                        slot?.subject
                                          ? {
                                              backgroundColor: (slot.subject.color || '#3B82F6') + '20',
                                              borderColor: slot.subject.color || '#3B82F6',
                                              borderStyle: 'solid',
                                            }
                                          : {}
                                      }
                                    >
                                      {slot?.subject ? (
                                        <>
                                          <div
                                            className="text-xs font-semibold"
                                            style={{ color: slot.subject.color || '#3B82F6' }}
                                          >
                                            {slot.subject.code}
                                          </div>
                                          <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
                                            {slot.subject.name}
                                          </div>
                                          {slot.teacher && (
                                            <div className="text-[9px] text-gray-500 dark:text-gray-500 truncate max-w-[80px] mt-0.5">
                                              {slot.teacher.fullName.split(' ')[0]}
                                            </div>
                                          )}
                                        </>
                                      ) : slot?.slotType && slot.slotType !== 'REGULAR' ? (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {getSlotTypeLabel(slot.slotType)}
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center gap-1">
                                          <Plus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                          <span className="text-[10px] text-gray-400 dark:text-gray-500">Add</span>
                                        </div>
                                      )}
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Sidebar - Stats */}
                <div className="space-y-4">
                  {/* Subject Distribution */}
                  <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Subject Distribution
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {getSubjectStats().map((subject) => (
                        <div key={subject.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: subject.color || '#3B82F6' }}
                            />
                            <span className="text-gray-700 dark:text-gray-300">{subject.code}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-medium ${
                                subject.status === 'ok'
                                  ? 'text-green-600'
                                  : subject.status === 'under'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {subject.current}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500">{subject.creditsPerWeek}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Tips
                    </h3>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        Click on any empty slot to assign a subject
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        System will warn about teacher conflicts
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        Available teachers shown based on schedule
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>

      {/* Slot Assignment Modal */}
      <AnimatePresence>
        {isSlotModalOpen && selectedSlot && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSlotModalOpen(false)}
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
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Assign Period
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getDayLabel(selectedSlot.day)} • {selectedSlot.timing.name} ({selectedSlot.timing.startTime} - {selectedSlot.timing.endTime})
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSlotModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Conflicts Warning */}
                  {conflicts.length > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-700 dark:text-red-400">
                            Conflicts Detected
                          </p>
                          <ul className="text-xs text-red-600 dark:text-red-400 mt-1 space-y-1">
                            {conflicts.map((c, i) => (
                              <li key={i}>{c.message}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs mb-1 block">Period Type</Label>
                    <Dropdown
                      options={[
                        { value: 'REGULAR', label: 'Regular Period' },
                        { value: 'FREE', label: 'Free Period' },
                        { value: 'ASSEMBLY', label: 'Assembly' },
                        { value: 'ACTIVITY', label: 'Activity' },
                        { value: 'LAB', label: 'Lab/Practical' },
                        { value: 'SPECIAL', label: 'Special Event' },
                      ]}
                      value={slotForm.slotType}
                      onChange={(val) => setSlotForm({ ...slotForm, slotType: val })}
                      placeholder="Select type"
                    />
                  </div>

                  {slotForm.slotType === 'REGULAR' && (
                    <>
                      <div>
                        <Label className="text-xs mb-1 block">Subject</Label>
                        <Dropdown
                          options={subjects.map((s) => ({
                            value: s.id,
                            label: `${s.code} - ${s.name}`,
                          }))}
                          value={slotForm.subjectId}
                          onChange={(val) => setSlotForm({ ...slotForm, subjectId: val })}
                          placeholder="Select subject"
                          searchable
                        />
                      </div>

                      <div>
                        <Label className="text-xs mb-1 block">
                          Teacher
                          {availableTeachers.length > 0 && (
                            <span className="text-gray-400 font-normal ml-1">
                              ({availableTeachers.length} available)
                            </span>
                          )}
                        </Label>
                        <Dropdown
                          options={[
                            { value: '', label: 'No teacher assigned' },
                            ...teachers.map((t) => ({
                              value: t.id,
                              label: `${t.fullName} (${t.employeeId})`,
                              disabled: !availableTeachers.some((at) => at.id === t.id),
                            })),
                          ]}
                          value={slotForm.teacherId}
                          onChange={(val) => setSlotForm({ ...slotForm, teacherId: val })}
                          placeholder="Select teacher"
                          searchable
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-xs mb-1 block">Room (Optional)</Label>
                    <input
                      type="text"
                      value={slotForm.room}
                      onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      placeholder="e.g., Room 101, Lab A"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                    {currentTimetable?.slots.find(
                      (s) => s.dayOfWeek === selectedSlot.day && s.periodNumber === selectedSlot.period
                    ) && (
                      <Button
                        variant="outline"
                        onClick={handleRemoveSlot}
                        disabled={isSaving}
                        className="text-red-600 hover:bg-red-50 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="outline" onClick={() => setIsSlotModalOpen(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveSlot} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Template Modal */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTemplateModalOpen(false)}
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
                    Create Timetable Template
                  </h2>
                  <button
                    onClick={() => setIsTemplateModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="name" required className="text-xs">
                      Template Name
                    </Label>
                    <input
                      id="name"
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      placeholder="e.g., Regular Schedule"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Periods Per Day</Label>
                      <input
                        type="number"
                        value={templateForm.periodsPerDay}
                        onChange={(e) =>
                          setTemplateForm({ ...templateForm, periodsPerDay: parseInt(e.target.value) || 8 })
                        }
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        min={1}
                        max={12}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Period Duration (min)</Label>
                      <input
                        type="number"
                        value={templateForm.periodDuration}
                        onChange={(e) =>
                          setTemplateForm({ ...templateForm, periodDuration: parseInt(e.target.value) || 45 })
                        }
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        min={15}
                        max={120}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Working Days</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = templateForm.workingDays.includes(day)
                              ? templateForm.workingDays.filter((d) => d !== day)
                              : [...templateForm.workingDays, day]
                            setTemplateForm({ ...templateForm, workingDays: days })
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            templateForm.workingDays.includes(day)
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {getDayShort(day)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.isDefault}
                      onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Set as default template</span>
                  </label>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <Button type="button" variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Create
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Publish Confirmation Modal */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPublishModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                  Publish Timetable?
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  This will make the timetable visible to students and parents. Any previously published timetable for this class will be archived.
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setIsPublishModalOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handlePublish} disabled={isSaving} className="flex-1">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Publish
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
