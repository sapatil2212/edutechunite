'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  BookOpen, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  ClipboardList,
  Paperclip
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  subject: { name: string; code: string; color: string }
  createdBy: { fullName: string }
  maxMarks: number | null
  _count: { attachments: number }
  submission: {
    id: string
    status: string
    submittedAt: string | null
    marksObtained: number | null
    feedback: string | null
  } | null
}

export default function HomeworkPage() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all')

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        // Fetch from the new assignments API
        const res = await fetch('/api/institution/assignments')
        const data = await res.json()
        setAssignments(data.assignments || [])
      } catch (error) {
        console.error('Error fetching assignments:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchAssignments()
    }
  }, [session])

  const getFilteredAssignments = () => {
    const now = new Date()
    return assignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate)
      const isPending = !assignment.submission || assignment.submission.status === 'PENDING'
      const isSubmitted = assignment.submission && ['SUBMITTED', 'LATE_SUBMITTED', 'EVALUATED', 'LATE'].includes(assignment.submission.status)
      const isOverdue = isPending && dueDate < now

      switch (filter) {
        case 'pending': return isPending && !isOverdue
        case 'submitted': return isSubmitted
        case 'overdue': return isOverdue
        default: return true
      }
    })
  }

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    
    if (!assignment.submission || assignment.submission.status === 'PENDING') {
      if (dueDate < now) {
        return <Badge variant="danger">Overdue</Badge>
      }
      return <Badge variant="warning">Pending</Badge>
    }
    
    if (['SUBMITTED', 'LATE_SUBMITTED', 'LATE'].includes(assignment.submission.status)) {
      return <Badge variant="primary">Submitted</Badge>
    }
    
    if (assignment.submission.status === 'EVALUATED') {
      return <Badge variant="success">Evaluated</Badge>
    }

    return null
  }

  const getDaysLeft = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff < 0) return `${Math.abs(diff)} days overdue`
    if (diff === 0) return 'Due today'
    if (diff === 1) return '1 day left'
    return `${diff} days left`
  }

  const filteredAssignments = getFilteredAssignments()

  const pendingCount = assignments.filter(a => (!a.submission || a.submission.status === 'PENDING') && new Date(a.dueDate) >= new Date()).length
  const overdueCount = assignments.filter(a => (!a.submission || a.submission.status === 'PENDING') && new Date(a.dueDate) < new Date()).length
  const submittedCount = assignments.filter(a => a.submission && ['SUBMITTED', 'LATE_SUBMITTED', 'EVALUATED', 'LATE'].includes(a.submission.status)).length
  const dueTodayCount = assignments.filter(a => {
    const today = new Date().toISOString().split('T')[0]
    const due = new Date(a.dueDate).toISOString().split('T')[0]
    return due === today && (!a.submission || a.submission.status === 'PENDING')
  }).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your assignments and track your academic progress</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending"
          value={pendingCount.toString()}
          change="Assignments to do"
          trend="up"
          icon={ClipboardList}
          color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Due Today"
          value={dueTodayCount.toString()}
          change="Urgent tasks"
          trend="down"
          icon={Clock}
          color="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
        />
        <StatCard
          title="Overdue"
          value={overdueCount.toString()}
          change="Missing deadlines"
          trend="down"
          icon={AlertCircle}
          color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
        />
        <StatCard
          title="Completed"
          value={submittedCount.toString()}
          change="Done this term"
          trend="up"
          icon={CheckCircle2}
          color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700 w-fit">
        {(['all', 'pending', 'submitted', 'overdue'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`
              px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200
              ${filter === tab 
                ? 'bg-white dark:bg-dark-700 text-primary-700 dark:text-primary-400 shadow-soft' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
            `}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Assignments list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <Card className="border-none shadow-soft p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No assignments found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all' ? 'No assignments have been assigned yet.' : `No ${filter} assignments at the moment.`}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAssignments.map((assignment) => (
            <Card
              key={assignment.id}
              className="border-none shadow-soft hover:shadow-md transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0"
                      style={{ backgroundColor: assignment.subject?.color || '#6B7280' }}
                    >
                      <span className="text-xs font-bold opacity-80 uppercase leading-none mb-1">
                        {assignment.subject?.code?.substring(0, 3) || 'HW'}
                      </span>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                          {assignment.title}
                        </h3>
                        {getStatusBadge(assignment)}
                      </div>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <BookOpen className="w-4 h-4" />
                          {assignment.subject?.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <User className="w-4 h-4" />
                          {assignment.createdBy?.fullName}
                        </div>
                        {assignment._count?.attachments > 0 && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <Paperclip className="w-4 h-4" />
                            {assignment._count.attachments} attachment{assignment._count.attachments !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-18 md:ml-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <p className={`text-xs font-bold mt-0.5 ${
                        new Date(assignment.dueDate) < new Date() && (!assignment.submission || assignment.submission.status === 'PENDING')
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}>
                        {getDaysLeft(assignment.dueDate)}
                      </p>
                    </div>
                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-dark-800 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                {assignment.description && (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-dark-900/40 p-3 rounded-xl border border-gray-100 dark:border-dark-800">
                    {assignment.description}
                  </p>
                )}

                {/* Show evaluation if evaluated */}
                {assignment.submission?.status === 'EVALUATED' && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-green-800 dark:text-green-300">
                        Score: {assignment.submission.marksObtained}/{assignment.maxMarks}
                      </span>
                    </div>
                    {assignment.submission.feedback && (
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                        " {assignment.submission.feedback} "
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
