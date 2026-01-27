'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Archive,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Course {
  id: string
  name: string
  code: string | null
  description: string | null
  type: 'ACADEMIC' | 'CERTIFICATION' | 'TRAINING' | 'COACHING'
  durationValue: number | null
  durationUnit: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  _count: {
    academicUnits: number
    students: number
  }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'ACADEMIC' as Course['type'],
    durationValue: 1,
    durationUnit: 'YEARS',
    status: 'ACTIVE' as Course['status'],
  })

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/institution/courses')
      const result = await response.json()
      if (result.success) {
        setCourses(result.data)
      } else {
        setError(result.message || 'Failed to fetch courses')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch courses')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const openModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        name: course.name,
        code: course.code || '',
        description: course.description || '',
        type: course.type,
        durationValue: course.durationValue || 1,
        durationUnit: course.durationUnit || 'YEARS',
        status: course.status,
      })
    } else {
      setEditingCourse(null)
      setFormData({
        name: '',
        code: '',
        description: '',
        type: 'ACADEMIC',
        durationValue: 1,
        durationUnit: 'YEARS',
        status: 'ACTIVE',
      })
    }
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCourse(null)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    try {
      const url = editingCourse
        ? `/api/institution/courses/${editingCourse.id}`
        : '/api/institution/courses'

      const response = await fetch(url, {
        method: editingCourse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchCourses()
      } else {
        setFormError(result.message || 'Failed to save course')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setFormError('Failed to save course')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/institution/courses/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setDeleteConfirm(null)
        fetchCourses()
      } else {
        setError(result.message || 'Failed to delete course')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete course')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Courses
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your academic programs and courses
              </p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4" />
              Add Course
            </Button>
          </div>

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
          ) : courses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Courses Found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Define your first course to start organizing your academic structure.
              </p>
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4" />
                Create Course
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5 relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {course.name}
                        </h3>
                        {course.code && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded uppercase">
                            {course.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {course.description || 'No description'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                        course.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : course.status === 'ARCHIVED'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-2 bg-gray-50 dark:bg-dark-700/50 rounded-lg text-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Units</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{course._count.academicUnits}</p>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-dark-700/50 rounded-lg text-center">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Students</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{course._count.students}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
                    <Button
                      size="xs"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openModal(course)}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setDeleteConfirm(course.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {course._count.students > 0 ? <Archive className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
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
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
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
                    <div className="col-span-2">
                      <Label htmlFor="name" required className="text-xs font-bold uppercase">
                        Course Name
                      </Label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg mt-1"
                        placeholder="e.g., Computer Science"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="code" className="text-xs font-bold uppercase">
                        Course Code
                      </Label>
                      <input
                        id="code"
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg mt-1"
                        placeholder="e.g., CS101"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type" className="text-xs font-bold uppercase">
                        Course Type
                      </Label>
                      <select
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg mt-1"
                      >
                        <option value="ACADEMIC">Academic</option>
                        <option value="CERTIFICATION">Certification</option>
                        <option value="TRAINING">Training</option>
                        <option value="COACHING">Coaching</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-xs font-bold uppercase">
                      Description
                    </Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg mt-1 min-h-[80px]"
                      placeholder="Brief description of the course..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="durationValue" className="text-xs font-bold uppercase">
                        Duration
                      </Label>
                      <input
                        id="durationValue"
                        type="number"
                        min="1"
                        value={formData.durationValue}
                        onChange={(e) => setFormData({ ...formData, durationValue: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="durationUnit" className="text-xs font-bold uppercase">
                        Unit
                      </Label>
                      <select
                        id="durationUnit"
                        value={formData.durationUnit}
                        onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg mt-1"
                      >
                        <option value="YEARS">Years</option>
                        <option value="MONTHS">Months</option>
                        <option value="WEEKS">Weeks</option>
                        <option value="DAYS">Days</option>
                      </select>
                    </div>
                  </div>

                  {editingCourse && (
                    <div>
                      <Label htmlFor="status" className="text-xs font-bold uppercase">
                        Status
                      </Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg mt-1"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
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
                          {editingCourse ? 'Update' : 'Create'}
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
                  {courses.find(c => c.id === deleteConfirm)?._count.students ? 'Archive Course?' : 'Delete Course?'}
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  {courses.find(c => c.id === deleteConfirm)?._count.students 
                    ? 'This course has enrolled students. It will be archived instead of permanently deleted to preserve records.'
                    : 'This action cannot be undone. The course will be permanently removed.'}
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
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {courses.find(c => c.id === deleteConfirm)?._count.students ? 'Archive' : 'Delete'}
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
