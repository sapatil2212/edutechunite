'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MoreVertical,
  Pencil,
  Archive,
  BookOpen
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { AssignmentStatusBadge, AssignmentTypeBadge, getDueDateStatus, formatDate } from '@/components/assignments/AssignmentCard'

interface Assignment {
  id: string
  title: string
  description: string | null
  instructions: string | null
  type: 'HOMEWORK' | 'PRACTICE' | 'PROJECT' | 'ACTIVITY' | 'ASSESSMENT'
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED'
  dueDate: string
  dueTime: string | null
  maxMarks: number | null
  academicUnit: { id: string; name: string }
  section: { id: string; name: string } | null
  subject: { id: string; name: string; code: string; color: string | null } | null
  stats: {
    totalStudents: number
    submitted: number
    evaluated: number
    pending: number
    submissionRate: number
  }
}

interface AssignedClass {
  id: string
  name: string
  studentCount: number
  subjects: Array<{ id: string; name: string; color: string | null }>
  sections?: Array<{ id: string; name: string; studentCount: number }>
}

export default function TeacherAssignmentsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const action = searchParams.get('action')
  
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([])

  useEffect(() => {
    fetchAssignments()
    fetchTeacherClasses()
  }, [])

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/institution/assignments')
      const data = await response.json()
      if (response.ok) {
        setAssignments(data.assignments || [])
      } else {
        setError(data.error || 'Failed to fetch assignments')
      }
    } catch (err) {
      setError('An error occurred while fetching assignments')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeacherClasses = async () => {
    try {
      const response = await fetch('/api/institution/teachers/my-classes')
      const data = await response.json()
      if (data.success) {
        const classes: AssignedClass[] = [
          ...(data.data.classTeacherClasses || []),
          ...(data.data.subjectTeacherClasses || []),
        ]
        // Deduplicate classes
        const uniqueClasses = Array.from(new Map(classes.map(c => [c.id, c])).values())
        setAssignedClasses(uniqueClasses)
      }
    } catch (err) {
      console.error('Error fetching teacher classes:', err)
    }
  }

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    active: assignments.filter(a => a.status === 'PUBLISHED').length,
    drafts: assignments.filter(a => a.status === 'DRAFT').length,
    evaluated: assignments.reduce((acc, a) => acc + (a.stats?.evaluated || 0), 0),
    total: assignments.length,
  }

  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'PUBLISHED', label: 'Active' },
    { value: 'DRAFT', label: 'Drafts' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'CLOSED', label: 'Closed' },
  ]

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Assignments
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create and manage tasks for your students
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Active Tasks" 
          value={stats.active.toString()} 
          change="Currently live"
          trend="up"
          icon={FileText}
          color="bg-primary/20 text-primary-700 dark:text-primary-400" 
        />
        <StatCard 
          title="Drafts" 
          value={stats.drafts.toString()} 
          change="Awaiting publish"
          trend="up"
          icon={Pencil}
          color="bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400" 
        />
        <StatCard 
          title="Evaluations" 
          value={stats.evaluated.toString()} 
          change="Completed"
          trend="up"
          icon={CheckCircle2}
          color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
        />
        <StatCard 
          title="Total Library" 
          value={stats.total.toString()} 
          change="All records"
          trend="up"
          icon={Archive}
          color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" 
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-700 transition-colors" />
          <Input
            placeholder="Search by title, subject or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-white dark:bg-dark-800 border-none shadow-soft h-12 rounded-2xl"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select 
              options={statusOptions}
              value={statusFilter} 
              onChange={setStatusFilter}
            />
          </div>
          <Button onClick={() => router.push('/teacher/assignments/create')}>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </div>
      </div>

      {/* Assignment List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-bold text-center uppercase tracking-widest text-xs">Syncing Tasks...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2 text-center">Failed to Load</h3>
          <p className="text-red-700 dark:text-red-300 text-center">{error}</p>
          <Button onClick={fetchAssignments} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState 
          isFiltered={!!searchQuery || statusFilter !== 'ALL'} 
          onCreateClick={() => router.push('/teacher/assignments/create')} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentItem key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </>
  )
}

function EmptyState({ isFiltered, onCreateClick }: { isFiltered: boolean, onCreateClick: () => void }) {
  return (
    <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent text-center">
      <CardContent className="py-20 flex flex-col items-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-primary-700" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {isFiltered ? 'No matching assignments' : 'No assignments yet'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
          {isFiltered 
            ? "Try adjusting your search or filters to find what you're looking for."
            : "Get started by creating your first assignment for your classes."}
        </p>
        <Button onClick={onCreateClick}>
          <Plus className="w-4 h-4 mr-2" />
          Create Assignment
        </Button>
      </CardContent>
    </Card>
  )
}

function AssignmentItem({ assignment }: { assignment: Assignment }) {
  const dueDateInfo = getDueDateStatus(assignment.dueDate, assignment.dueTime || undefined)
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <AssignmentTypeBadge type={assignment.type} />
            <AssignmentStatusBadge status={assignment.status} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
            {assignment.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="truncate">{assignment.academicUnit.name} {assignment.section ? `(${assignment.section.name})` : '(All)'}</span>
            <span>•</span>
            <span className="truncate font-medium text-gray-700 dark:text-gray-300">{assignment.subject?.name || 'No Subject'}</span>
          </div>
        </div>
        <div className="relative ml-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Due {formatDate(assignment.dueDate)}</span>
          </div>
          <div className={`font-semibold ${dueDateInfo.color}`}>
            {dueDateInfo.label}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="text-gray-400">Submissions</span>
            <span className="text-primary-700 dark:text-primary-400">{assignment.stats.submitted} / {assignment.stats.totalStudents}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${assignment.stats.submissionRate}%` }}
              className="h-full bg-primary rounded-full" 
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
