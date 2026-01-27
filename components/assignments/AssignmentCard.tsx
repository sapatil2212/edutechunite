'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Users,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Archive,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AssignmentStats {
  totalStudents: number
  submitted: number
  evaluated: number
  pending: number
  submissionRate: number
}

interface AssignmentData {
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
  stats?: AssignmentStats
  _count?: { submissions: number; attachments: number }
}

interface AssignmentCardProps {
  assignment: AssignmentData
  onDelete?: (id: string) => void
  showActions?: boolean
  variant?: 'teacher' | 'student'
}

export function AssignmentStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    DRAFT: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      icon: FileText,
      label: 'Draft',
    },
    SCHEDULED: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      icon: Clock,
      label: 'Scheduled',
    },
    PUBLISHED: {
      bg: 'bg-primary/20',
      text: 'text-primary-700 dark:text-primary-400',
      icon: CheckCircle2,
      label: 'Active',
    },
    CLOSED: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      icon: XCircle,
      label: 'Closed',
    },
    ARCHIVED: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-500 dark:text-gray-500',
      icon: Archive,
      label: 'Archived',
    },
  }

  const config = statusConfig[status] || statusConfig.DRAFT
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export function SubmissionStatusBadge({ status, isLate }: { status: string; isLate?: boolean }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      label: 'Pending',
    },
    SUBMITTED: {
      bg: 'bg-primary/20',
      text: 'text-primary-700 dark:text-primary-400',
      label: isLate ? 'Late' : 'Submitted',
    },
    LATE: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      label: 'Late',
    },
    EVALUATED: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      label: 'Evaluated',
    },
    RETURNED: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      label: 'Returned',
    },
  }

  const config = statusConfig[status] || statusConfig.PENDING

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

export function AssignmentTypeBadge({ type }: { type: string }) {
  const typeConfig: Record<string, { bg: string; text: string }> = {
    HOMEWORK: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    PRACTICE: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
    PROJECT: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
    ACTIVITY: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  }

  const config = typeConfig[type] || typeConfig.HOMEWORK

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {type.charAt(0) + type.slice(1).toLowerCase()}
    </span>
  )
}

export function getDueDateStatus(dueDate: string, dueTime?: string) {
  const now = new Date()
  const due = new Date(dueDate)
  if (dueTime) {
    const [hours, minutes] = dueTime.split(':').map(Number)
    due.setHours(hours, minutes, 59, 999)
  } else {
    due.setHours(23, 59, 59, 999)
  }

  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffMs < 0) {
    return { status: 'overdue', label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, color: 'text-red-600 dark:text-red-400' }
  } else if (diffDays === 0) {
    return { status: 'today', label: 'Due today', color: 'text-orange-600 dark:text-orange-400' }
  } else if (diffDays <= 3) {
    return { status: 'soon', label: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, color: 'text-yellow-600 dark:text-yellow-400' }
  } else {
    return { status: 'upcoming', label: `Due in ${diffDays} days`, color: 'text-gray-600 dark:text-gray-400' }
  }
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AssignmentCard({ assignment, onDelete, showActions = true, variant = 'teacher' }: AssignmentCardProps) {
  const dueDateInfo = getDueDateStatus(assignment.dueDate, assignment.dueTime)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AssignmentTypeBadge type={assignment.type} />
            <AssignmentStatusBadge status={assignment.status} />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {assignment.title}
          </h3>
          {assignment.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
              {assignment.description}
            </p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs mb-3">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <BookOpen className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">
            {assignment.academicUnit.name}
            {assignment.section && ` - ${assignment.section.name}`}
            {assignment.subject && ` | ${assignment.subject.name}`}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 flex-shrink-0 text-gray-400" />
          <span className={dueDateInfo.color}>
            {dueDateInfo.label} ({formatDate(assignment.dueDate)}
            {assignment.dueTime && ` ${assignment.dueTime}`})
          </span>
        </div>

        {assignment.maxMarks && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <FileText className="w-3 h-3 flex-shrink-0" />
            Max Marks: {assignment.maxMarks}
          </div>
        )}
      </div>

      {/* Stats for teachers */}
      {variant === 'teacher' && assignment.stats && (
        <div className="bg-gray-50 dark:bg-dark-900 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500 dark:text-gray-400">Submission Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {assignment.stats.submitted}/{assignment.stats.totalStudents}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${assignment.stats.submissionRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium">
            <span className="text-primary-700 dark:text-primary-400">
              {assignment.stats.evaluated} evaluated
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              {assignment.stats.pending} pending
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
          <Link href={variant === 'teacher' ? `/dashboard/academic/assignments/${assignment.id}` : `/dashboard/assignments/${assignment.id}`} className="flex-1">
            <Button size="xs" variant="outline" className="w-full">
              <Eye className="w-3 h-3" />
              View
            </Button>
          </Link>
          {variant === 'teacher' && (
            <>
              <Link href={`/dashboard/academic/assignments/${assignment.id}/submissions`}>
                <Button size="xs" variant="outline">
                  <Users className="w-3 h-3" />
                </Button>
              </Link>
              <Link href={`/dashboard/academic/assignments/${assignment.id}/edit`}>
                <Button size="xs" variant="ghost">
                  <Pencil className="w-3 h-3" />
                </Button>
              </Link>
              {onDelete && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onDelete(assignment.id)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
          {variant === 'student' && assignment.status === 'PUBLISHED' && (
            <Link href={`/dashboard/assignments/${assignment.id}`}>
              <Button size="xs">
                <Send className="w-3 h-3" />
                Submit
              </Button>
            </Link>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default AssignmentCard
