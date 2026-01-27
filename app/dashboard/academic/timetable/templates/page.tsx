'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Settings,
  ChevronUp,
  ChevronDown,
  Coffee,
  ArrowLeft,
  Sparkles,
  Upload,
  FileText,
  Wand2,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface PeriodTiming {
  id?: string
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
  _count?: {
    timetableSlots: number
    timetables: number
  }
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

const getDayShort = (day: string) => day.slice(0, 3)

// Helper to generate default period timings
const generateDefaultTimings = (
  periodsPerDay: number,
  duration: number,
  startHour: number = 9,
  startMinute: number = 0
): PeriodTiming[] => {
  const timings: PeriodTiming[] = []
  let currentHour = startHour
  let currentMinute = startMinute
  let periodCount = 0

  for (let i = 1; periodCount < periodsPerDay; i++) {
    const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`

    // Add period duration
    currentMinute += duration
    while (currentMinute >= 60) {
      currentMinute -= 60
      currentHour++
    }

    const endTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`

    // Add short break after period 2
    if (periodCount === 1) {
      timings.push({
        periodNumber: i,
        name: `Period ${periodCount + 1}`,
        startTime,
        endTime,
        isBreak: false,
      })
      periodCount++

      // Add short break
      const breakStart = endTime
      currentMinute += 15
      while (currentMinute >= 60) {
        currentMinute -= 60
        currentHour++
      }
      const breakEnd = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
      timings.push({
        periodNumber: i + 1,
        name: 'Short Break',
        startTime: breakStart,
        endTime: breakEnd,
        isBreak: true,
      })
      continue
    }

    // Add lunch break after period 4
    if (periodCount === 3) {
      timings.push({
        periodNumber: i,
        name: `Period ${periodCount + 1}`,
        startTime,
        endTime,
        isBreak: false,
      })
      periodCount++

      // Add lunch break
      const lunchStart = endTime
      currentMinute += 45
      while (currentMinute >= 60) {
        currentMinute -= 60
        currentHour++
      }
      const lunchEnd = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
      timings.push({
        periodNumber: i + 1,
        name: 'Lunch Break',
        startTime: lunchStart,
        endTime: lunchEnd,
        isBreak: true,
      })
      continue
    }

    timings.push({
      periodNumber: i,
      name: `Period ${periodCount + 1}`,
      startTime,
      endTime,
      isBreak: false,
    })
    periodCount++
  }

  // Re-number periods
  return timings.map((t, idx) => ({ ...t, periodNumber: idx + 1 }))
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TimetableTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TimetableTemplate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    periodsPerDay: 8,
    periodDuration: 45,
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    isDefault: false,
    isActive: true,
  })

  const [periodTimings, setPeriodTimings] = useState<PeriodTiming[]>([])

  // AI Import states
  const [showAiImport, setShowAiImport] = useState(false)
  const [aiTextContent, setAiTextContent] = useState('')
  const [aiFile, setAiFile] = useState<File | null>(null)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiPreview, setAiPreview] = useState<{
    name: string
    description: string
    periodsPerDay: number
    periodDuration: number
    workingDays: string[]
    periodTimings: PeriodTiming[]
  } | null>(null)

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/institution/timetable/templates')
      const result = await response.json()
      if (result.success) {
        setTemplates(result.data || [])
      } else {
        setError(result.message || 'Failed to fetch templates')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch templates')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const openModal = (template?: TimetableTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        description: template.description || '',
        periodsPerDay: template.periodsPerDay,
        periodDuration: template.periodDuration,
        workingDays: template.workingDays as string[],
        isDefault: template.isDefault,
        isActive: template.isActive,
      })
      setPeriodTimings(template.periodTimings || [])
    } else {
      setEditingTemplate(null)
      setFormData({
        name: '',
        description: '',
        periodsPerDay: 8,
        periodDuration: 45,
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
        isDefault: false,
        isActive: true,
      })
      setPeriodTimings(generateDefaultTimings(8, 45))
    }
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTemplate(null)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    try {
      const url = editingTemplate
        ? `/api/institution/timetable/templates/${editingTemplate.id}`
        : '/api/institution/timetable/templates'

      const response = await fetch(url, {
        method: editingTemplate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          periodTimings,
        }),
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchTemplates()
        setSuccessMessage(editingTemplate ? 'Template updated successfully' : 'Template created successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setFormError(result.message || 'Failed to save template')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setFormError('Failed to save template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/institution/timetable/templates/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setDeleteConfirm(null)
        fetchTemplates()
        setSuccessMessage('Template deleted successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setError(result.message || 'Failed to delete template')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete template')
    }
  }

  const addPeriod = (isBreak: boolean = false) => {
    const lastTiming = periodTimings[periodTimings.length - 1]
    const newNumber = periodTimings.length + 1

    let startTime = '09:00'
    let endTime = '09:45'

    if (lastTiming) {
      startTime = lastTiming.endTime
      // Parse and add duration
      const [hours, mins] = lastTiming.endTime.split(':').map(Number)
      let newMins = mins + (isBreak ? 15 : formData.periodDuration)
      let newHours = hours
      while (newMins >= 60) {
        newMins -= 60
        newHours++
      }
      endTime = `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
    }

    setPeriodTimings([
      ...periodTimings,
      {
        periodNumber: newNumber,
        name: isBreak ? 'Break' : `Period ${periodTimings.filter((p) => !p.isBreak).length + 1}`,
        startTime,
        endTime,
        isBreak,
      },
    ])
  }

  const updatePeriod = (index: number, field: keyof PeriodTiming, value: string | boolean) => {
    const updated = [...periodTimings]
    updated[index] = { ...updated[index], [field]: value }
    setPeriodTimings(updated)
  }

  const removePeriod = (index: number) => {
    const updated = periodTimings.filter((_, i) => i !== index)
    // Re-number
    setPeriodTimings(updated.map((p, i) => ({ ...p, periodNumber: i + 1 })))
  }

  const movePeriod = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === periodTimings.length - 1)
    ) {
      return
    }

    const updated = [...periodTimings]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]

    // Re-number
    setPeriodTimings(updated.map((p, i) => ({ ...p, periodNumber: i + 1 })))
  }

  const regenerateTimings = () => {
    setPeriodTimings(generateDefaultTimings(formData.periodsPerDay, formData.periodDuration))
  }

  // AI Import functions
  const handleAiExtract = async () => {
    if (!aiTextContent && !aiFile) {
      setAiError('Please provide text content or upload a file')
      return
    }

    setIsAiProcessing(true)
    setAiError('')
    setAiPreview(null)

    try {
      let response

      if (aiFile) {
        // Send file
        const formData = new FormData()
        formData.append('file', aiFile)
        response = await fetch('/api/institution/ai/extract-timetable', {
          method: 'POST',
          body: formData,
        })
      } else {
        // Send text content via FormData
        const formData = new FormData()
        formData.append('textContent', aiTextContent)
        response = await fetch('/api/institution/ai/extract-timetable', {
          method: 'POST',
          body: formData,
        })
      }

      const result = await response.json()

      if (result.success && result.data) {
        setAiPreview(result.data)
      } else {
        const errorMessage = result.error ? `${result.message}: ${result.error}` : result.message || 'Failed to extract timetable'
        setAiError(errorMessage)
      }
    } catch (err) {
      console.error('AI extraction error:', err)
      setAiError('Failed to process. Please try again.')
    } finally {
      setIsAiProcessing(false)
    }
  }

  const applyAiExtraction = () => {
    if (!aiPreview) return

    setFormData({
      ...formData,
      name: aiPreview.name,
      description: aiPreview.description,
      periodsPerDay: aiPreview.periodsPerDay,
      periodDuration: aiPreview.periodDuration,
      workingDays: aiPreview.workingDays,
    })
    setPeriodTimings(aiPreview.periodTimings)
    setShowAiImport(false)
    setAiPreview(null)
    setAiTextContent('')
    setAiFile(null)
  }

  const resetAiImport = () => {
    setShowAiImport(false)
    setAiTextContent('')
    setAiFile(null)
    setAiPreview(null)
    setAiError('')
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

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/academic/timetable">
                <Button variant="outline" size="xs">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Timetable Templates
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Define period structures and timings
                </p>
              </div>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </div>

          {/* Error */}
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

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Templates Yet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Create a template to define your timetable structure with periods, breaks, and timings.
              </p>
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-dark-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {template.name}
                          </h3>
                          {template.isDefault && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="xs" variant="ghost" onClick={() => openModal(template)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setDeleteConfirm(template.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                          disabled={template._count && template._count.timetables > 0}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600 dark:text-gray-400">
                      <span>{template.periodsPerDay} periods/day</span>
                      <span>{template.periodDuration} min each</span>
                      <span>{(template.workingDays as string[]).length} working days</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {(template.workingDays as string[]).map((day) => (
                        <span
                          key={day}
                          className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {getDayShort(day)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Period Timings Preview */}
                  <div className="p-4 bg-gray-50 dark:bg-dark-700/50 max-h-48 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Period Timings
                    </p>
                    <div className="space-y-1">
                      {template.periodTimings.map((timing) => (
                        <div
                          key={timing.periodNumber}
                          className={`flex items-center justify-between text-xs py-1 px-2 rounded ${
                            timing.isBreak
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                              : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {timing.isBreak && <Coffee className="w-3 h-3" />}
                            {timing.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {timing.startTime} - {timing.endTime}
                          </span>
                        </div>
                      ))}
                    </div>
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
              <div className="w-full max-w-2xl bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingTemplate ? 'Edit Template' : 'Create Template'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-4">
                    {formError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                      </div>
                    )}

                    {/* AI Import Section */}
                    {!editingTemplate && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                        {!showAiImport ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  Import with AI
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Upload PDF/Excel or paste timetable details
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="xs"
                              onClick={() => setShowAiImport(true)}
                              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                            >
                              <Wand2 className="w-4 h-4" />
                              Use AI
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                AI Timetable Import
                              </h4>
                              <button
                                type="button"
                                onClick={resetAiImport}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {aiError && (
                              <div className="p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                                <p className="text-xs text-red-600 dark:text-red-400">{aiError}</p>
                              </div>
                            )}

                            {!aiPreview ? (
                              <>
                                {/* File Upload */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Upload File (PDF, Excel, Word, Image)
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.csv"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          setAiFile(file)
                                          setAiTextContent('')
                                        }
                                      }}
                                      className="hidden"
                                      id="ai-file-upload"
                                    />
                                    <label
                                      htmlFor="ai-file-upload"
                                      className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                        aiFile
                                          ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                                          : 'border-gray-300 dark:border-dark-600 hover:border-purple-400'
                                      }`}
                                    >
                                      {aiFile ? (
                                        <>
                                          <FileText className="w-5 h-5 text-purple-500" />
                                          <span className="text-sm text-purple-700 dark:text-purple-400 font-medium">
                                            {aiFile.name}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault()
                                              setAiFile(null)
                                            }}
                                            className="ml-2 text-gray-500 hover:text-red-500"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="w-5 h-5 text-gray-400" />
                                          <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Click to upload or drag & drop
                                          </span>
                                        </>
                                      )}
                                    </label>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
                                  <span className="text-xs text-gray-500">OR</span>
                                  <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
                                </div>

                                {/* Text Input */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Paste Timetable Details
                                  </label>
                                  <textarea
                                    value={aiTextContent}
                                    onChange={(e) => {
                                      setAiTextContent(e.target.value)
                                      setAiFile(null)
                                    }}
                                    rows={4}
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg resize-none"
                                    placeholder="Paste your timetable information here...&#10;&#10;Example:&#10;Period 1: 9:00 AM - 9:45 AM&#10;Period 2: 9:45 AM - 10:30 AM&#10;Short Break: 10:30 AM - 10:45 AM&#10;..."
                                  />
                                </div>

                                <Button
                                  type="button"
                                  onClick={handleAiExtract}
                                  disabled={isAiProcessing || (!aiTextContent && !aiFile)}
                                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                >
                                  {isAiProcessing ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Analyzing with AI...
                                    </>
                                  ) : (
                                    <>
                                      <Wand2 className="w-4 h-4" />
                                      Extract Timetable
                                    </>
                                  )}
                                </Button>
                              </>
                            ) : (
                              /* AI Preview */
                              <div className="space-y-3">
                                <div className="p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Extracted Template Preview
                                  </p>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {aiPreview.name}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600 dark:text-gray-400">Periods/Day:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {aiPreview.periodsPerDay}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {aiPreview.periodDuration} min
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600 dark:text-gray-400">Working Days:</span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {aiPreview.workingDays.map((d) => d.slice(0, 3)).join(', ')}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-600">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                      Period Timings ({aiPreview.periodTimings.length} items)
                                    </p>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                      {aiPreview.periodTimings.map((timing, idx) => (
                                        <div
                                          key={idx}
                                          className={`flex justify-between text-xs px-2 py-1 rounded ${
                                            timing.isBreak
                                              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                              : 'bg-gray-50 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                                          }`}
                                        >
                                          <span className="flex items-center gap-1">
                                            {timing.isBreak && <Coffee className="w-3 h-3" />}
                                            {timing.name}
                                          </span>
                                          <span>
                                            {timing.startTime} - {timing.endTime}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setAiPreview(null)}
                                    className="flex-1"
                                  >
                                    Try Again
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={applyAiExtraction}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="name" required className="text-xs">
                          Template Name
                        </Label>
                        <input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                          placeholder="e.g., Regular Schedule"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <Label htmlFor="description" className="text-xs">
                          Description
                        </Label>
                        <input
                          id="description"
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                          placeholder="Optional description"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Periods Per Day</Label>
                        <input
                          type="number"
                          value={formData.periodsPerDay}
                          onChange={(e) =>
                            setFormData({ ...formData, periodsPerDay: parseInt(e.target.value) || 8 })
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
                          value={formData.periodDuration}
                          onChange={(e) =>
                            setFormData({ ...formData, periodDuration: parseInt(e.target.value) || 45 })
                          }
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                          min={15}
                          max={120}
                        />
                      </div>
                    </div>

                    {/* Working Days */}
                    <div>
                      <Label className="text-xs">Working Days</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const days = formData.workingDays.includes(day)
                                ? formData.workingDays.filter((d) => d !== day)
                                : [...formData.workingDays, day]
                              setFormData({ ...formData, workingDays: days })
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              formData.workingDays.includes(day)
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {getDayShort(day)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Period Timings */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">Period Timings</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={regenerateTimings}
                          >
                            <Settings className="w-3 h-3" />
                            Auto Generate
                          </Button>
                          <Button type="button" size="xs" variant="outline" onClick={() => addPeriod(false)}>
                            <Plus className="w-3 h-3" />
                            Period
                          </Button>
                          <Button type="button" size="xs" variant="outline" onClick={() => addPeriod(true)}>
                            <Coffee className="w-3 h-3" />
                            Break
                          </Button>
                        </div>
                      </div>

                      <div className="border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                        {periodTimings.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No periods added. Click "Auto Generate" or add manually.
                          </div>
                        ) : (
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 dark:bg-dark-700 sticky top-0">
                              <tr>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-400 w-8">
                                  #
                                </th>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                  Name
                                </th>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-400 w-20">
                                  Start
                                </th>
                                <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-400 w-20">
                                  End
                                </th>
                                <th className="px-2 py-2 text-center font-medium text-gray-500 dark:text-gray-400 w-16">
                                  Break?
                                </th>
                                <th className="px-2 py-2 w-20"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {periodTimings.map((timing, index) => (
                                <tr
                                  key={index}
                                  className={`border-t border-gray-100 dark:border-dark-700 ${
                                    timing.isBreak ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                                  }`}
                                >
                                  <td className="px-2 py-1.5 text-gray-500">{timing.periodNumber}</td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={timing.name}
                                      onChange={(e) => updatePeriod(index, 'name', e.target.value)}
                                      className="w-full px-2 py-1 text-xs bg-transparent border border-gray-200 dark:border-dark-600 rounded"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="time"
                                      value={timing.startTime}
                                      onChange={(e) => updatePeriod(index, 'startTime', e.target.value)}
                                      className="w-full px-2 py-1 text-xs bg-transparent border border-gray-200 dark:border-dark-600 rounded"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="time"
                                      value={timing.endTime}
                                      onChange={(e) => updatePeriod(index, 'endTime', e.target.value)}
                                      className="w-full px-2 py-1 text-xs bg-transparent border border-gray-200 dark:border-dark-600 rounded"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    <input
                                      type="checkbox"
                                      checked={timing.isBreak}
                                      onChange={(e) => updatePeriod(index, 'isBreak', e.target.checked)}
                                      className="w-4 h-4 rounded border-gray-300 text-primary"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => movePeriod(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded disabled:opacity-30"
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => movePeriod(index, 'down')}
                                        disabled={index === periodTimings.length - 1}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded disabled:opacity-30"
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removePeriod(index)}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-primary"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Default template</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-primary"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || periodTimings.length === 0}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {editingTemplate ? 'Update' : 'Create'}
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
                  Delete Template?
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  This will permanently remove this template and its period timings.
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

