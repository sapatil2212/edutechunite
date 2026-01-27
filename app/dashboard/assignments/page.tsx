'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Search,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  BookOpen,
  Send,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Dropdown } from '@/components/ui/dropdown'
import {
  AssignmentTypeBadge,
  SubmissionStatusBadge,
  getDueDateStatus,
  formatDate,
} from '@/components/assignments/AssignmentCard'

interface Assignment {
  id: string
  title: string
  description?: string
  type: string
  maxMarks?: number
  dueDate: string
  dueTime?: string
  status: string
  allowLateSubmission: boolean
  academicUnit: { id: string; name: string }
  subject?: { id: string; name: string; color?: string }
  createdBy: { fullName: string }
  studentSubmission?: {
    id: string
    status: string
    isLate: boolean
    submittedAt?: string
    evaluation?: {
      marksObtained?: number
      feedback?: string
    }
  }
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      setError('')

      const params = new URLSearchParams({ limit: '50' })
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/institution/assignments?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAssignments(data.assignments || [])
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
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssignments()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const getSubmissionStatus = (assignment: Assignment) => {
    if (!assignment.studentSubmission) return 'PENDING'
    return assignment.studentSubmission.status
  }

  // Group assignments
  const dueToday = assignments.filter(a => {
    const status = getDueDateStatus(a.dueDate, a.dueTime)
    const subStatus = getSubmissionStatus(a)
    return status.status === 'today' && subStatus === 'PENDING'
  })

  const upcoming = assignments.filter(a => {
    const status = getDueDateStatus(a.dueDate, a.dueTime)
    const subStatus = getSubmissionStatus(a)
    return (status.status === 'soon' || status.status === 'upcoming') && subStatus === 'PENDING'
  })

  const overdue = assignments.filter(a => {
    const status = getDueDateStatus(a.dueDate, a.dueTime)
    const subStatus = getSubmissionStatus(a)
    return status.status === 'overdue' && subStatus === 'PENDING'
  })

  const submitted = assignments.filter(a => {
    const subStatus = getSubmissionStatus(a)
    return ['SUBMITTED', 'LATE'].includes(subStatus)
  })

  const evaluated = assignments.filter(a => {
    const subStatus = getSubmissionStatus(a)
    return subStatus === 'EVALUATED'
  })

  // Filter based on status filter
  let displayAssignments = assignments
  if (statusFilter === 'pending') {
    displayAssignments = [...dueToday, ...upcoming, ...overdue]
  } else if (statusFilter === 'submitted') {
    displayAssignments = submitted
  } else if (statusFilter === 'evaluated') {
    displayAssignments = evaluated
  }

  const renderAssignmentCard = (assignment: Assignment) => {
    const dueDateInfo = getDueDateStatus(assignment.dueDate, assignment.dueTime)
    const submissionStatus = getSubmissionStatus(assignment)

    return (
      <motion.div
        key={assignment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AssignmentTypeBadge type={assignment.type} />
              <SubmissionStatusBadge status={submissionStatus} isLate={assignment.studentSubmission?.isLate} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {assignment.title}
            </h3>
            {assignment.subject && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {assignment.subject.name}
              </p>
            )}
          </div>
          {assignment.studentSubmission?.evaluation?.marksObtained !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {assignment.studentSubmission.evaluation.marksObtained}
              </div>
              <div className="text-xs text-gray-500">
                / {assignment.maxMarks || 100}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className={dueDateInfo.color}>
              {dueDateInfo.label} ({formatDate(assignment.dueDate)})
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <BookOpen className="w-4 h-4" />
            {assignment.academicUnit.name} - {assignment.createdBy.fullName}
          </div>
        </div>

        {/* Feedback if evaluated */}
        {assignment.studentSubmission?.evaluation?.feedback && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-medium mb-1">
              <Star className="w-3 h-3" />
              Teacher Feedback
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-300 line-clamp-2">
              {assignment.studentSubmission.evaluation.feedback}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {submissionStatus === 'PENDING' ? (
            <Link href={`/dashboard/assignments/${assignment.id}`} className="flex-1">
              <Button className="w-full">
                <Send className="w-4 h-4" />
                Submit Now
              </Button>
            </Link>
          ) : (
            <Link href={`/dashboard/assignments/${assignment.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              My Assignments
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and submit your assignments
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {dueToday.length + upcoming.length + overdue.length}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {overdue.length}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">Submitted</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {submitted.length}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Star className="w-4 h-4" />
                <span className="text-xs font-medium">Evaluated</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {evaluated.length}
              </p>
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
            <div className="w-40">
              <Dropdown
                options={[
                  { value: '', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'submitted', label: 'Submitted' },
                  { value: 'evaluated', label: 'Evaluated' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter"
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
          ) : displayAssignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Assignments
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statusFilter ? 'No assignments found with this filter.' : 'You have no assignments yet.'}
              </p>
            </motion.div>
          ) : statusFilter ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayAssignments.map(renderAssignmentCard)}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Due Today */}
              {dueToday.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Due Today ({dueToday.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dueToday.map(renderAssignmentCard)}
                  </div>
                </section>
              )}

              {/* Overdue */}
              {overdue.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Overdue ({overdue.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overdue.map(renderAssignmentCard)}
                  </div>
                </section>
              )}

              {/* Upcoming */}
              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Upcoming ({upcoming.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcoming.map(renderAssignmentCard)}
                  </div>
                </section>
              )}

              {/* Submitted */}
              {submitted.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Submitted ({submitted.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {submitted.map(renderAssignmentCard)}
                  </div>
                </section>
              )}

              {/* Evaluated */}
              {evaluated.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Evaluated ({evaluated.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {evaluated.map(renderAssignmentCard)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
