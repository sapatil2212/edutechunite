'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  ChevronRight,
  BookOpen,
  Users,
  Archive,
  Paperclip,
  Link as LinkIcon,
  X,
  Upload,
  BookMarked,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function TeacherAssignmentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const action = searchParams.get('action')
  
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Attachments state
  const [attachments, setAttachments] = useState<any[]>([])
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const [showLinkInput, setShowLinkInput] = useState(false)

  // Form state
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    academicUnitId: '',
    sectionId: 'all',
    subjectId: '',
    type: 'HOMEWORK' as any,
    dueDate: '',
    dueTime: '23:59',
    submissionMode: 'ONLINE' as any,
    maxMarks: '',
    allowLateSubmission: true,
    status: 'PUBLISHED' as any,
    scheduledFor: '',
    scheduledTime: '08:00',
  })

  useEffect(() => {
    if (action === 'new') {
      setIsModalOpen(true)
    }
  }, [action])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.academicUnitId || !formData.subjectId) {
      alert('Please select a class and subject')
      return
    }

    // Duplicate title check
    const isDuplicate = assignments.some(a => 
      a.title.toLowerCase() === formData.title.toLowerCase() && 
      a.academicUnit.id === formData.academicUnitId
    )
    if (isDuplicate) {
      if (!confirm('An assignment with this title already exists for this class. Continue?')) {
        return
      }
    }

    setIsSubmitting(true)
    
    try {
      const payload = {
        ...formData,
        sectionId: formData.sectionId === 'all' ? null : formData.sectionId,
        academicYearId: 'current',
        attachments: attachments.map(a => ({
          type: a.type,
          url: a.url,
          fileName: a.title,
        })),
        scheduledFor: formData.status === 'SCHEDULED' 
          ? `${formData.scheduledFor}T${formData.scheduledTime}:00`
          : null,
      }

      const response = await fetch('/api/institution/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (response.ok) {
        setIsModalOpen(false)
        if (action === 'new') router.push('/teacher/assignments')
        fetchAssignments()
        // Reset form
        setFormData({
          title: '',
          description: '',
          instructions: '',
          academicUnitId: '',
          sectionId: 'all',
          subjectId: '',
          type: 'HOMEWORK',
          dueDate: '',
          dueTime: '23:59',
          submissionMode: 'ONLINE',
          maxMarks: '',
          allowLateSubmission: true,
          status: 'PUBLISHED',
          scheduledFor: '',
          scheduledTime: '08:00',
        })
        setAttachments([])
      } else {
        alert(data.error || 'Failed to create assignment')
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLink = () => {
    if (newLink.title && newLink.url) {
      setAttachments([...attachments, { type: 'LINK', title: newLink.title, url: newLink.url }])
      setNewLink({ title: '', url: '' })
      setShowLinkInput(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
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

  const selectedClass = assignedClasses.find(c => c.id === formData.academicUnitId)

  // Options for Select components
  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'PUBLISHED', label: 'Active' },
    { value: 'DRAFT', label: 'Drafts' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'CLOSED', label: 'Closed' },
  ]

  const classOptions = assignedClasses.map(cls => ({ value: cls.id, label: cls.name }))
  
  const subjectOptions = selectedClass?.subjects?.map(sub => ({ value: sub.id, label: sub.name })) || []
  
  const sectionOptions = [
    { value: 'all', label: 'All Sections' },
    ...(selectedClass?.sections?.map(sec => ({ value: sec.id, label: sec.name })) || [])
  ]

  const assignmentTypeOptions = [
    { value: 'HOMEWORK', label: 'Homework' },
    { value: 'PRACTICE', label: 'Practice' },
    { value: 'PROJECT', label: 'Project' },
    { value: 'ACTIVITY', label: 'Activity' },
    { value: 'ASSESSMENT', label: 'Assessment' },
  ]

  const submissionModeOptions = [
    { value: 'ONLINE', label: 'Online (File Upload)' },
    { value: 'OFFLINE', label: 'Offline (Manual)' },
    { value: 'BOTH', label: 'Both' },
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
          <Button onClick={() => setIsModalOpen(true)}>
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
              onCreateClick={() => setIsModalOpen(true)} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => (
                <AssignmentItem key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary-700 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Assignment</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fill in the details to publish or save as draft</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6">
                <form id="assignment-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Assignment Title</Label>
                        <Input
                          id="title"
                          required
                          placeholder="e.g., Chapter 1: Introduction to Algebra"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="h-11 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Brief Description (Visible in list)</Label>
                        <Input
                          id="description"
                          placeholder="Short summary of the assignment..."
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="h-11 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="instructions" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Detailed Instructions</Label>
                      <textarea
                        id="instructions"
                        rows={4}
                        placeholder="Provide step-by-step guidelines for the students..."
                        value={formData.instructions}
                        onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                        className="w-full h-[110px] rounded-xl border-none bg-gray-50 dark:bg-gray-900 p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Target Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                    <div>
                      <Label className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-1 block">Class</Label>
                      <Select 
                        options={classOptions}
                        value={formData.academicUnitId} 
                        onChange={(val) => setFormData({...formData, academicUnitId: val, sectionId: 'all', subjectId: ''})}
                        placeholder="Select Class"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-1 block">Subject</Label>
                      <Select 
                        options={subjectOptions}
                        value={formData.subjectId} 
                        onChange={(val) => setFormData({...formData, subjectId: val})}
                        disabled={!formData.academicUnitId}
                        placeholder="Select Subject"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-1 block">Type</Label>
                      <Select 
                        options={assignmentTypeOptions}
                        value={formData.type} 
                        onChange={(val) => setFormData({...formData, type: val})}
                        placeholder="Select Type"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-1 block">Section</Label>
                      <Select 
                        options={sectionOptions}
                        value={formData.sectionId} 
                        onChange={(val) => setFormData({...formData, sectionId: val})}
                        disabled={!formData.academicUnitId || !selectedClass?.sections}
                        placeholder="All Sections"
                      />
                    </div>
                  </div>

                  {/* Submission & Deadlines */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="dueDate" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Due Date</Label>
                      <Input
                        id="dueDate"
                        required
                        type="date"
                        value={formData.dueDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        className="h-10 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueTime" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Due Time</Label>
                      <Input
                        id="dueTime"
                        type="time"
                        value={formData.dueTime}
                        onChange={(e) => setFormData({...formData, dueTime: e.target.value})}
                        className="h-10 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxMarks" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Max Marks (Optional)</Label>
                      <Input
                        id="maxMarks"
                        type="number"
                        placeholder="Not graded"
                        value={formData.maxMarks}
                        onChange={(e) => setFormData({...formData, maxMarks: e.target.value})}
                        className="h-10 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Settings & Mode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Submission Mode</Label>
                      <Select 
                        options={submissionModeOptions}
                        value={formData.submissionMode} 
                        onChange={(val) => setFormData({...formData, submissionMode: val})}
                      />
                    </div>
                    <div className="flex items-center gap-6 pb-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.allowLateSubmission}
                          onChange={(e) => setFormData({...formData, allowLateSubmission: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Late Submission</span>
                      </label>
                    </div>
                  </div>

                  {/* Scheduling Section */}
                  <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-4 mb-4">
                      <Label className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider">Publishing Status:</Label>
                      <div className="flex gap-2">
                        {['PUBLISHED', 'DRAFT', 'SCHEDULED'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFormData({...formData, status: s})}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              formData.status === s 
                                ? 'bg-primary text-dark-900 shadow-md' 
                                : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {formData.status === 'SCHEDULED' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <Label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">Release Date</Label>
                          <Input 
                            type="date" 
                            value={formData.scheduledFor}
                            onChange={(e) => setFormData({...formData, scheduledFor: e.target.value})}
                            className="bg-white dark:bg-gray-900 h-9" 
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">Release Time</Label>
                          <Input 
                            type="time" 
                            value={formData.scheduledTime}
                            onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                            className="bg-white dark:bg-gray-900 h-9" 
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attachments & Resources</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="text-primary-700 dark:text-primary-400 h-8"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Add Link
                      </Button>
                    </div>

                    {showLinkInput && (
                      <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <Input 
                          placeholder="Link Title" 
                          value={newLink.title} 
                          onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                          className="flex-1 h-9"
                        />
                        <Input 
                          placeholder="https://..." 
                          value={newLink.url} 
                          onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                          className="flex-[2] h-9"
                        />
                        <Button type="button" onClick={addLink} size="sm" variant="primary" className="h-9">Add</Button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attachments.map((at, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              {at.type === 'LINK' ? <LinkIcon className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{at.title}</p>
                              <p className="text-[10px] text-gray-500 truncate">{at.url}</p>
                            </div>
                          </div>
                          <button onClick={() => removeAttachment(idx)} className="p-1 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      <Button type="button" variant="outline" className="border-dashed border-2 h-[52px] flex flex-col items-center justify-center text-gray-400 hover:text-primary-700 dark:hover:text-primary-400 hover:border-primary transition-all">
                        <Upload className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Upload Document / Image</span>
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-3">
                  <Button 
                    form="assignment-form"
                    type="submit"
                    disabled={isSubmitting}
                    variant="primary"
                    className="min-w-[140px] shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> {formData.status === 'PUBLISHED' ? 'Publish Now' : 'Save as ' + formData.status.toLowerCase()}</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-9 border-gray-200 dark:border-gray-700 hover:bg-primary/10 hover:text-primary-700 dark:hover:text-primary-400 transition-colors">
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          View
        </Button>
        <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-9 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center">
          <Users className="w-3.5 h-3.5 mr-1.5" />
          Evaluate
        </Button>
      </div>
    </motion.div>
  )
}
