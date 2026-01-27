'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Mail,
  Phone,
  BookOpen,
  Clock,
  Key,
  Eye,
  EyeOff,
  LogIn,
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
  color: string | null
}

interface Teacher {
  id: string
  employeeId: string
  fullName: string
  email: string | null
  phone: string | null
  qualification: string | null
  specialization: string | null
  maxPeriodsPerDay: number
  maxPeriodsPerWeek: number
  isActive: boolean
  userId: string | null
  user?: {
    id: string
    email: string
    status: string
  } | null
  subjectAssignments: {
    subject: Subject
  }[]
  _count: {
    timetableSlots: number
  }
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    qualification: '',
    specialization: '',
    maxPeriodsPerDay: 6,
    maxPeriodsPerWeek: 30,
    subjectIds: [] as string[],
    isActive: true,
    enableLogin: false,
    password: '',
    resetPassword: false,
  })
  const [showPassword, setShowPassword] = useState(false)

  const fetchData = async () => {
    try {
      const [teachersRes, subjectsRes] = await Promise.all([
        fetch('/api/institution/teachers?activeOnly=false'),
        fetch('/api/institution/subjects'),
      ])

      const [teachersData, subjectsData] = await Promise.all([
        teachersRes.json(),
        subjectsRes.json(),
      ])

      if (teachersData.success) setTeachers(teachersData.data || [])
      if (subjectsData.success) setSubjects(subjectsData.data || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredTeachers = teachers.filter((teacher) => {
    return (
      teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const openModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher)
      setFormData({
        employeeId: teacher.employeeId,
        fullName: teacher.fullName,
        email: teacher.email || '',
        phone: teacher.phone || '',
        qualification: teacher.qualification || '',
        specialization: teacher.specialization || '',
        maxPeriodsPerDay: teacher.maxPeriodsPerDay,
        maxPeriodsPerWeek: teacher.maxPeriodsPerWeek,
        subjectIds: teacher.subjectAssignments.map((sa) => sa.subject.id),
        isActive: teacher.isActive,
        enableLogin: !!teacher.userId,
        password: '',
        resetPassword: false,
      })
    } else {
      setEditingTeacher(null)
      setFormData({
        employeeId: '',
        fullName: '',
        email: '',
        phone: '',
        qualification: '',
        specialization: '',
        maxPeriodsPerDay: 6,
        maxPeriodsPerWeek: 30,
        subjectIds: [],
        isActive: true,
        enableLogin: false,
        password: '',
        resetPassword: false,
      })
    }
    setShowPassword(false)
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTeacher(null)
    setFormError('')
    setFieldErrors({})
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError('')
    setFieldErrors({})

    try {
      const url = editingTeacher
        ? `/api/institution/teachers/${editingTeacher.id}`
        : '/api/institution/teachers'

      const response = await fetch(url, {
        method: editingTeacher ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchData()
      } else {
        // Handle field-specific errors
        if (result.field) {
          setFieldErrors({ [result.field]: result.message })
        } else {
          setFormError(result.message || 'Failed to save teacher')
        }
      }
    } catch (err) {
      console.error('Submit error:', err)
      setFormError('Failed to save teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/institution/teachers/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setDeleteConfirm(null)
        fetchData()
      } else {
        setError(result.message || 'Failed to delete teacher')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete teacher')
    }
  }

  const toggleSubject = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }))
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
                Teachers
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage teaching staff and their subject assignments
              </p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4" />
              Add Teacher
            </Button>
          </div>

          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teachers..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg"
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
          ) : filteredTeachers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No Teachers Found' : 'No Teachers Yet'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try adjusting your search criteria.'
                  : 'Add teachers to assign them to timetable slots.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => openModal()}>
                  <Plus className="w-4 h-4" />
                  Add Teacher
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {teacher.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {teacher.fullName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {teacher.employeeId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="xs" variant="ghost" onClick={() => openModal(teacher)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(teacher.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        disabled={teacher._count.timetableSlots > 0}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {teacher.email && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="w-3 h-3" />
                        {teacher.email}
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-3 h-3" />
                        {teacher.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      Max: {teacher.maxPeriodsPerDay}/day, {teacher.maxPeriodsPerWeek}/week
                    </div>
                  </div>

                  {teacher.subjectAssignments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <BookOpen className="w-3 h-3" />
                        Subjects
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjectAssignments.map((sa) => (
                          <span
                            key={sa.subject.id}
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: (sa.subject.color || '#3B82F6') + '20',
                              color: sa.subject.color || '#3B82F6',
                            }}
                          >
                            {sa.subject.code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {teacher._count.timetableSlots} periods assigned
                    </span>
                    <div className="flex items-center gap-2">
                      {teacher.userId && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 flex items-center gap-1">
                          <LogIn className="w-3 h-3" />
                          Login
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          teacher.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
                        }`}
                      >
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </span>
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
              <div className="w-full max-w-lg bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700 sticky top-0 bg-white dark:bg-dark-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
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
                    <div>
                      <Label htmlFor="employeeId" required className="text-xs">
                        Employee ID
                      </Label>
                      <input
                        id="employeeId"
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => {
                          setFormData({ ...formData, employeeId: e.target.value })
                          clearFieldError('employeeId')
                        }}
                        className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border rounded-lg ${
                          fieldErrors.employeeId
                            ? 'border-red-500 dark:border-red-500'
                            : 'border-gray-200 dark:border-dark-700'
                        }`}
                        placeholder="e.g., TCH001"
                        required
                      />
                      {fieldErrors.employeeId && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.employeeId}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="fullName" required className="text-xs">
                        Full Name
                      </Label>
                      <input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => {
                          setFormData({ ...formData, fullName: e.target.value })
                          clearFieldError('fullName')
                        }}
                        className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border rounded-lg ${
                          fieldErrors.fullName
                            ? 'border-red-500 dark:border-red-500'
                            : 'border-gray-200 dark:border-dark-700'
                        }`}
                        placeholder="e.g., John Doe"
                        required
                      />
                      {fieldErrors.fullName && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.fullName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-xs">
                        Email
                      </Label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value })
                          clearFieldError('email')
                        }}
                        className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border rounded-lg ${
                          fieldErrors.email
                            ? 'border-red-500 dark:border-red-500'
                            : 'border-gray-200 dark:border-dark-700'
                        }`}
                        placeholder="email@example.com"
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-xs">
                        Phone
                      </Label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qualification" className="text-xs">
                        Qualification
                      </Label>
                      <input
                        id="qualification"
                        type="text"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        placeholder="e.g., M.Sc, B.Ed"
                      />
                    </div>

                    <div>
                      <Label htmlFor="specialization" className="text-xs">
                        Specialization
                      </Label>
                      <input
                        id="specialization"
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxPeriodsPerDay" className="text-xs">
                        Max Periods/Day
                      </Label>
                      <input
                        id="maxPeriodsPerDay"
                        type="number"
                        value={formData.maxPeriodsPerDay}
                        onChange={(e) =>
                          setFormData({ ...formData, maxPeriodsPerDay: parseInt(e.target.value) || 6 })
                        }
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        min={1}
                        max={10}
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxPeriodsPerWeek" className="text-xs">
                        Max Periods/Week
                      </Label>
                      <input
                        id="maxPeriodsPerWeek"
                        type="number"
                        value={formData.maxPeriodsPerWeek}
                        onChange={(e) =>
                          setFormData({ ...formData, maxPeriodsPerWeek: parseInt(e.target.value) || 30 })
                        }
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        min={1}
                        max={50}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Subjects</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Select subjects this teacher can teach
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700">
                      {subjects.map((subject) => (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => toggleSubject(subject.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            formData.subjectIds.includes(subject.id)
                              ? 'text-white'
                              : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-600'
                          }`}
                          style={
                            formData.subjectIds.includes(subject.id)
                              ? { backgroundColor: subject.color || '#3B82F6' }
                              : {}
                          }
                        >
                          {subject.code} - {subject.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>

                  {/* Login Credentials Section */}
                  <div className="border-t border-gray-200 dark:border-dark-700 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Login Access</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.enableLogin}
                          onChange={(e) => setFormData({ ...formData, enableLogin: e.target.checked, password: '', resetPassword: false })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer dark:bg-dark-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-dark-600 peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {formData.enableLogin && (
                      <div className="space-y-4 bg-gray-50 dark:bg-dark-900 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {editingTeacher?.userId
                            ? 'This teacher has login access. You can reset their password below.'
                            : 'Enable login to allow this teacher to access the teacher dashboard.'}
                        </p>

                        {/* Email is required for login */}
                        {!formData.email && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                              Email is required for login. Please enter an email address above.
                            </p>
                          </div>
                        )}

                        {/* Password field for new login or reset */}
                        {(!editingTeacher?.userId || formData.resetPassword) && (
                          <div>
                            <Label htmlFor="password" required className="text-xs">
                              {editingTeacher?.userId ? 'New Password' : 'Password'}
                            </Label>
                            <div className="relative">
                              <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => {
                                  setFormData({ ...formData, password: e.target.value })
                                  clearFieldError('password')
                                }}
                                className={`w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-dark-800 border rounded-lg ${
                                  fieldErrors.password
                                    ? 'border-red-500 dark:border-red-500'
                                    : 'border-gray-200 dark:border-dark-700'
                                }`}
                                placeholder="Min 8 characters, uppercase, lowercase, number, special char"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {fieldErrors.password ? (
                              <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">
                                Must contain: 8+ chars, uppercase, lowercase, number, special character
                              </p>
                            )}
                          </div>
                        )}

                        {/* Reset password option for existing users */}
                        {editingTeacher?.userId && !formData.resetPassword && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, resetPassword: true })}
                            className="text-sm text-primary hover:text-primary-600 font-medium"
                          >
                            Reset Password
                          </button>
                        )}

                        {editingTeacher?.userId && formData.resetPassword && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, resetPassword: false, password: '' })}
                            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                          >
                            Cancel Password Reset
                          </button>
                        )}
                      </div>
                    )}
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
                          {editingTeacher ? 'Update' : 'Create'}
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
                  Delete Teacher?
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  This will permanently remove this teacher. This action cannot be undone.
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

