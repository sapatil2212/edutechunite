'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Calendar,
  Settings,
  Upload,
  X,
  Loader2,
  AlertCircle,
  Plus,
  Link as LinkIcon,
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

interface AcademicUnit {
  id: string
  name: string
  type: string
  children?: AcademicUnit[]
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Attachment {
  type: 'FILE' | 'LINK'
  url: string
  fileName?: string
  fileSize?: number
  mimeType?: string
}

export default function AddAssignmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([])
  const [sections, setSections] = useState<AcademicUnit[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    academicYearId: '',
    academicUnitId: '',
    sectionId: '',
    subjectId: '',
    type: 'HOMEWORK',
    category: 'INDIVIDUAL',
    submissionMode: 'ONLINE',
    maxMarks: '',
    dueDate: '',
    dueTime: '23:59',
    allowLateSubmission: false,
    allowResubmission: false,
    status: 'DRAFT',
  })

  useEffect(() => {
    fetchAcademicYears()
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (formData.academicYearId) {
      fetchAcademicUnits(formData.academicYearId)
    }
  }, [formData.academicYearId])

  useEffect(() => {
    if (formData.academicUnitId) {
      const unit = academicUnits.find(u => u.id === formData.academicUnitId)
      if (unit?.children && unit.children.length > 0) {
        setSections(unit.children)
      } else {
        setSections([])
        setFormData(prev => ({ ...prev, sectionId: '' }))
      }
    }
  }, [formData.academicUnitId, academicUnits])

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch('/api/institution/academic-years')
      const data = await res.json()
      if (data.success) {
        setAcademicYears(data.data || [])
        const currentYear = data.data?.find((y: AcademicYear) => y.isCurrent)
        if (currentYear) {
          setFormData(prev => ({ ...prev, academicYearId: currentYear.id }))
        }
      }
    } catch (err) {
      console.error('Error fetching academic years:', err)
    }
  }

  const fetchAcademicUnits = async (yearId: string) => {
    try {
      const res = await fetch(`/api/institution/academic-units?academicYearId=${yearId}&parentId=null&includeChildren=true`)
      const data = await res.json()
      if (data.success) {
        setAcademicUnits(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching academic units:', err)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/institution/subjects')
      const data = await res.json()
      if (data.success) {
        setSubjects(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching subjects:', err)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError('')

    try {
      for (const file of Array.from(files)) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('folder', 'assignments')

        const res = await fetch('/api/institution/upload', {
          method: 'POST',
          body: formDataUpload,
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setAttachments(prev => [...prev, {
            type: 'FILE',
            url: data.url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }])
        } else {
          setError(data.error || `Failed to upload ${file.name}`)
        }
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const addLinkAttachment = () => {
    const url = prompt('Enter the URL:')
    if (url) {
      setAttachments(prev => [...prev, {
        type: 'LINK',
        url,
        fileName: url,
      }])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.academicYearId) errors.academicYearId = 'Academic year is required'
    if (!formData.academicUnitId) errors.academicUnitId = 'Class is required'
    if (!formData.dueDate) errors.dueDate = 'Due date is required'
    if (sections.length > 0 && !formData.sectionId) errors.sectionId = 'Section is required'
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (publishStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!validateForm()) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const payload = {
        ...formData,
        maxMarks: formData.maxMarks ? parseInt(formData.maxMarks) : null,
        status: publishStatus,
        attachments,
      }

      const res = await fetch('/api/institution/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create assignment')
      }

      router.push('/dashboard/academic/assignments')
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/academic/assignments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Create Assignment
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a new assignment for your students
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Assignment Details
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" required className="text-xs">Title</Label>
                    <input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value })
                        clearFieldError('title')
                      }}
                      className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border rounded-lg ${
                        fieldErrors.title ? 'border-red-500' : 'border-gray-200 dark:border-dark-700'
                      }`}
                      placeholder="e.g., Math Homework - Chapter 5"
                    />
                    {fieldErrors.title && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Dropdown
                        options={[
                          { value: 'HOMEWORK', label: 'Homework' },
                          { value: 'PRACTICE', label: 'Practice' },
                          { value: 'PROJECT', label: 'Project' },
                          { value: 'ACTIVITY', label: 'Activity' },
                        ]}
                        value={formData.type}
                        onChange={(val) => setFormData({ ...formData, type: val })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Submission Mode</Label>
                      <Dropdown
                        options={[
                          { value: 'ONLINE', label: 'Online Upload' },
                          { value: 'OFFLINE', label: 'Offline (No Upload)' },
                          { value: 'BOTH', label: 'Both' },
                        ]}
                        value={formData.submissionMode}
                        onChange={(val) => setFormData({ ...formData, submissionMode: val })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Description</Label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg resize-none"
                      placeholder="Brief description of the assignment..."
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Instructions</Label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg resize-none"
                      placeholder="Detailed instructions for students..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Class & Subject */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Class & Subject
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required className="text-xs">Academic Year</Label>
                    <Dropdown
                      options={academicYears.map(y => ({
                        value: y.id,
                        label: `${y.name}${y.isCurrent ? ' (Current)' : ''}`,
                      }))}
                      value={formData.academicYearId}
                      onChange={(val) => {
                        setFormData({ ...formData, academicYearId: val, academicUnitId: '', sectionId: '' })
                        clearFieldError('academicYearId')
                      }}
                      placeholder="Select Year"
                    />
                    {fieldErrors.academicYearId && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.academicYearId}</p>
                    )}
                  </div>

                  <div>
                    <Label required className="text-xs">Class/Batch</Label>
                    <Dropdown
                      options={academicUnits.map(u => ({
                        value: u.id,
                        label: u.name,
                      }))}
                      value={formData.academicUnitId}
                      onChange={(val) => {
                        setFormData({ ...formData, academicUnitId: val, sectionId: '' })
                        clearFieldError('academicUnitId')
                      }}
                      placeholder="Select Class"
                    />
                    {fieldErrors.academicUnitId && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.academicUnitId}</p>
                    )}
                  </div>

                  {sections.length > 0 && (
                    <div>
                      <Label required className="text-xs">Section</Label>
                      <Dropdown
                        options={sections.map(s => ({
                          value: s.id,
                          label: s.name,
                        }))}
                        value={formData.sectionId}
                        onChange={(val) => {
                          setFormData({ ...formData, sectionId: val })
                          clearFieldError('sectionId')
                        }}
                        placeholder="Select Section"
                      />
                      {fieldErrors.sectionId && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.sectionId}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">Subject (Optional)</Label>
                    <Dropdown
                      options={[
                        { value: '', label: 'No Subject' },
                        ...subjects.map(s => ({
                          value: s.id,
                          label: `${s.name} (${s.code})`,
                        })),
                      ]}
                      value={formData.subjectId}
                      onChange={(val) => setFormData({ ...formData, subjectId: val })}
                      placeholder="Select Subject"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Attachments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Attachments
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                      />
                      <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-dark-700 rounded-lg cursor-pointer hover:border-primary transition-colors">
                        {isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                          <Upload className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-500">
                          {isUploading ? 'Uploading...' : 'Upload Files'}
                        </span>
                      </div>
                    </label>
                    <Button type="button" variant="outline" onClick={addLinkAttachment}>
                      <LinkIcon className="w-4 h-4" />
                      Add Link
                    </Button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            {attachment.type === 'LINK' ? (
                              <LinkIcon className="w-4 h-4 text-blue-500" />
                            ) : (
                              <FileText className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                              {attachment.fileName}
                            </span>
                            {attachment.fileSize && (
                              <span className="text-xs text-gray-400">
                                ({(attachment.fileSize / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Due Date & Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Schedule
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label required className="text-xs">Due Date</Label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => {
                        setFormData({ ...formData, dueDate: e.target.value })
                        clearFieldError('dueDate')
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border rounded-lg ${
                        fieldErrors.dueDate ? 'border-red-500' : 'border-gray-200 dark:border-dark-700'
                      }`}
                    />
                    {fieldErrors.dueDate && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.dueDate}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs">Due Time</Label>
                    <input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Max Marks (Optional)</Label>
                    <input
                      type="number"
                      value={formData.maxMarks}
                      onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Advanced Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
              >
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-500/10 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-gray-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Advanced Settings
                    </h2>
                  </div>
                  <Plus className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-45' : ''}`} />
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.allowLateSubmission}
                        onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                        className="w-4 h-4 text-primary rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Allow late submission
                      </span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.allowResubmission}
                        onChange={(e) => setFormData({ ...formData, allowResubmission: e.target.checked })}
                        className="w-4 h-4 text-primary rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Allow resubmission
                      </span>
                    </label>

                    <div>
                      <Label className="text-xs">Category</Label>
                      <Dropdown
                        options={[
                          { value: 'INDIVIDUAL', label: 'Individual' },
                          { value: 'GROUP', label: 'Group' },
                        ]}
                        value={formData.category}
                        onChange={(val) => setFormData({ ...formData, category: val })}
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
              >
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSubmit('PUBLISHED')}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Publish Now'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Save as Draft
                  </Button>
                  <Link href="/dashboard/academic/assignments">
                    <Button variant="ghost" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
