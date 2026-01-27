'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  LayoutGrid,
  List,
  X,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Dropdown } from '@/components/ui/dropdown'
import Link from 'next/link'

interface Student {
  id: string
  admissionNumber: string
  fullName: string
  dateOfBirth: string
  gender: string
  status: string
  email: string | null
  phone: string | null
  profilePhoto: string | null
  rollNumber: string | null
  academicYear: { id: string; name: string }
  academicUnit: { 
    id: string
    name: string
    type: string
    parent?: { id: string; name: string } | null
  }
  guardians: Array<{
    relationship: string
    isPrimary: boolean
    guardian: {
      id: string
      fullName: string
      phone: string
      email: string | null
      relationship: string
    }
  }>
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchStudents = async () => {
    setIsLoading(true)
    setError('')
    try {
      let url = `/api/institution/students?page=${currentPage}&limit=20`
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`
      if (statusFilter) url += `&status=${statusFilter}`

      const res = await fetch(url)
      const data = await res.json()
      
      if (res.ok) {
        setStudents(data.students || [])
        setPagination(data.pagination || null)
      } else {
        setError(data.error || 'Failed to fetch students')
      }
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Failed to fetch students')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [currentPage, statusFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchStudents()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/institution/students/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (response.ok) {
        setDeleteConfirm(null)
        fetchStudents()
      } else {
        setError(result.error || 'Failed to delete student')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete student')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            Active
          </span>
        )
      case 'INACTIVE':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            Inactive
          </span>
        )
      case 'ALUMNI':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
            Alumni
          </span>
        )
      case 'TRANSFERRED':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
            Transferred
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {status}
          </span>
        )
    }
  }

  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true
    return (
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

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
                Students
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage student records and information
              </p>
            </div>
            <div className="flex items-center gap-3">
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
              <Link href="/dashboard/students/add">
                <Button>
                  <Plus className="w-4 h-4" />
                  Add Student
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, admission number, or email..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg"
              />
            </div>
            <div className="w-40">
              <Dropdown
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'ALUMNI', label: 'Alumni' },
                  { value: 'TRANSFERRED', label: 'Transferred' },
                ]}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val)
                  setCurrentPage(1)
                }}
                placeholder="Status"
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
          ) : filteredStudents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || statusFilter ? 'No Students Found' : 'No Students Yet'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first student to the system.'}
              </p>
              {!searchQuery && !statusFilter && (
                <Link href="/dashboard/students/add">
                  <Button>
                    <Plus className="w-4 h-4" />
                    Add Student
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {student.profilePhoto ? (
                        <img 
                          src={student.profilePhoto} 
                          alt={student.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {student.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {student.fullName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {student.admissionNumber}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(student.status)}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <GraduationCap className="w-3 h-3" />
                      {student.academicUnit?.parent?.name ? `${student.academicUnit.parent.name} - ` : ''}
                      {student.academicUnit?.name}
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-3 h-3" />
                        {student.phone}
                      </div>
                    )}
                  </div>

                  {student.guardians?.[0]?.guardian && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Guardian</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {student.guardians[0].guardian.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{student.guardians[0].guardian.phone}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-dark-700">
                    <Link href={`/dashboard/students/${student.id}`} className="flex-1">
                      <Button size="xs" variant="outline" className="w-full">
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/students/${student.id}/edit`}>
                      <Button size="xs" variant="ghost">
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setDeleteConfirm(student.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
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
                      Student
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Admission No.
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Class
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Guardian
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
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 dark:border-dark-700 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-700/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {student.profilePhoto ? (
                            <img 
                              src={student.profilePhoto} 
                              alt={student.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold text-xs">
                                {student.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {student.fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {student.email || student.phone || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white">{student.admissionNumber}</p>
                        {student.rollNumber && (
                          <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {student.academicUnit?.parent?.name ? `${student.academicUnit.parent.name} - ` : ''}
                          {student.academicUnit?.name}
                        </p>
                        <p className="text-xs text-gray-500">{student.academicYear?.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {student.guardians?.[0]?.guardian ? (
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {student.guardians[0].guardian.fullName}
                            </p>
                            <p className="text-xs text-gray-500">{student.guardians[0].guardian.phone}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/students/${student.id}`}>
                            <Button size="xs" variant="outline">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/students/${student.id}/edit`}>
                            <Button size="xs" variant="ghost">
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </Link>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(student.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-dark-700 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
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
                  Delete Student?
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  This will permanently remove this student and all their records. This action cannot be undone.
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
