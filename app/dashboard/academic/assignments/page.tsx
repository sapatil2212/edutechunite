'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  FileText,
  Trash2,
  Filter,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Dropdown } from '@/components/ui/dropdown'
import { AssignmentCard, AssignmentStatusBadge } from '@/components/assignments/AssignmentCard'

interface Assignment {
  id: string
  title: string
  description?: string
  type: string
  category: string
  submissionMode: string
  maxMarks?: number
  dueDate: string
  dueTime?: string
  status: string
  publishedAt?: string
  allowLateSubmission: boolean
  academicUnit: { id: string; name: string; type: string }
  section?: { id: string; name: string }
  subject?: { id: string; name: string; code: string; color?: string }
  createdBy: { id: string; fullName: string }
  stats?: {
    totalStudents: number
    submitted: number
    evaluated: number
    pending: number
    submissionRate: number
  }
  _count?: { submissions: number; attachments: number }
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })

      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('type', typeFilter)
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/institution/assignments?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAssignments(data.assignments || [])
        setPagination(data.pagination)
      } else {
        setError(data.error || 'Failed to fetch assignments')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch assignments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [currentPage, statusFilter, typeFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchAssignments()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/institution/assignments/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (response.ok) {
        setDeleteConfirm(null)
        fetchAssignments()
      } else {
        setError(result.error || 'Failed to delete assignment')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete assignment')
    }
  }

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'PUBLISHED', label: 'Active' },
    { value: 'CLOSED', label: 'Closed' },
  ]

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'HOMEWORK', label: 'Homework' },
    { value: 'PRACTICE', label: 'Practice' },
    { value: 'PROJECT', label: 'Project' },
    { value: 'ACTIVITY', label: 'Activity' },
  ]

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
                Assignments
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create and manage assignments for your classes
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
              <Link href="/dashboard/academic/assignments/add">
                <Button>
                  <Plus className="w-4 h-4" />
                  Create Assignment
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
                placeholder="Search assignments..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg"
              />
            </div>
            <div className="w-36">
              <Dropdown
                options={statusOptions}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val)
                  setCurrentPage(1)
                }}
                placeholder="Status"
              />
            </div>
            <div className="w-36">
              <Dropdown
                options={typeOptions}
                value={typeFilter}
                onChange={(val) => {
                  setTypeFilter(val)
                  setCurrentPage(1)
                }}
                placeholder="Type"
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
          ) : assignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || statusFilter || typeFilter ? 'No Assignments Found' : 'No Assignments Yet'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter || typeFilter
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first assignment.'}
              </p>
              {!searchQuery && !statusFilter && !typeFilter && (
                <Link href="/dashboard/academic/assignments/add">
                  <Button>
                    <Plus className="w-4 h-4" />
                    Create Assignment
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onDelete={(id) => setDeleteConfirm(id)}
                  variant="teacher"
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Assignment
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Class
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Due Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Submissions
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
                  {assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="border-b border-gray-100 dark:border-dark-700 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-700/50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {assignment.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {assignment.subject?.name || assignment.type}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {assignment.academicUnit.name}
                          {assignment.section && ` - ${assignment.section.name}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                        {assignment.dueTime && (
                          <p className="text-xs text-gray-500">{assignment.dueTime}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {assignment.stats ? (
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {assignment.stats.submitted}/{assignment.stats.totalStudents}
                            </p>
                            <div className="w-20 h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full mt-1">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${assignment.stats.submissionRate}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <AssignmentStatusBadge status={assignment.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/academic/assignments/${assignment.id}`}>
                            <Button size="xs" variant="outline">
                              View
                            </Button>
                          </Link>
                          <Link href={`/dashboard/academic/assignments/${assignment.id}/submissions`}>
                            <Button size="xs" variant="outline">
                              Submissions
                            </Button>
                          </Link>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(assignment.id)}
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
                  Archive Assignment?
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  This will archive the assignment. Student submissions will be preserved for records.
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Archive
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
