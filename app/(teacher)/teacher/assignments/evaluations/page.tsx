'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  ClipboardList, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  Award,
  Loader2,
  Check
} from 'lucide-react'

type View = 'assignments' | 'submissions' | 'evaluation'

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date))
}

export default function TeacherEvaluationsPage() {
  const [view, setView] = useState<View>('assignments')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Evaluation Form State
  const [evaluationForm, setEvaluationForm] = useState({
    marksObtained: '',
    feedback: '',
    status: 'EVALUATED'
  })

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/institution/assignments')
      const data = await res.json()
      if (data.assignments) {
        // Filter to only show assignments with submissions or those that are published
        setAssignments(data.assignments.filter((a: any) => a.status === 'PUBLISHED' || a.status === 'CLOSED'))
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      alert('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSubmissions = useCallback(async (assignmentId: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/institution/assignments/${assignmentId}/submissions`)
      const data = await res.json()
      if (data.submissions) {
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
      alert('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const handleAssignmentClick = (assignment: any) => {
    setSelectedAssignment(assignment)
    fetchSubmissions(assignment.id)
    setView('submissions')
  }

  const handleSubmissionClick = (submission: any) => {
    setSelectedSubmission(submission)
    setEvaluationForm({
      marksObtained: submission.evaluation?.marksObtained?.toString() || '',
      feedback: submission.evaluation?.feedback || '',
      status: submission.evaluation?.status || 'EVALUATED'
    })
    setView('evaluation')
  }

  const handleBack = () => {
    if (view === 'evaluation') {
      setView('submissions')
    } else if (view === 'submissions') {
      setView('assignments')
      setSelectedAssignment(null)
      fetchAssignments() // Refresh stats
    }
  }

  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment || !selectedSubmission) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/institution/assignments/${selectedAssignment.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          ...evaluationForm,
          marksObtained: evaluationForm.marksObtained ? parseFloat(evaluationForm.marksObtained) : null
        })
      })

      const data = await res.json()
      if (res.ok) {
        alert(data.message || 'Evaluation saved')
        // Update local state
        setSubmissions(prev => prev.map(s => 
          s.id === selectedSubmission.id 
            ? { ...s, status: evaluationForm.status === 'RETURNED' ? 'RETURNED' : 'EVALUATED', evaluation: data.evaluation } 
            : s
        ))
        setView('submissions')
      } else {
        alert(data.error || 'Failed to save evaluation')
      }
    } catch (error) {
      console.error('Error saving evaluation:', error)
      alert('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return <Badge variant="info">Submitted</Badge>
      case 'LATE': return <Badge variant="warning">Late</Badge>
      case 'EVALUATED': return <Badge variant="success">Evaluated</Badge>
      case 'RETURNED': return <Badge variant="secondary">Returned</Badge>
      case 'PENDING': return <Badge variant="secondary">Not Submitted</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const submissionStats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.status !== 'PENDING').length,
    evaluated: submissions.filter(s => s.status === 'EVALUATED').length,
    pending: submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'LATE').length
  }

  const filteredSubmissions = submissions.filter((s: any) => {
    const matchesSearch = s.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'pending' && (s.status === 'SUBMITTED' || s.status === 'LATE')) ||
                         (filterStatus === 'evaluated' && s.status === 'EVALUATED') ||
                         (filterStatus === 'returned' && s.status === 'RETURNED')
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {view !== 'assignments' && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2 h-8 w-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {view === 'assignments' && 'Evaluations'}
              {view === 'submissions' && selectedAssignment?.title}
              {view === 'evaluation' && `Review: ${selectedSubmission?.student.fullName}`}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {view === 'assignments' && 'Select an assignment to review submissions'}
            {view === 'submissions' && `${selectedAssignment?.subject?.name} • ${selectedAssignment?.academicUnit?.name}`}
            {view === 'evaluation' && `${selectedAssignment?.title} • Admission ID: ${selectedSubmission?.student.admissionNumber}`}
          </p>
        </div>

        {view === 'assignments' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search assignments..."
                className="pl-9 h-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {view === 'submissions' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                className="pl-9 h-10 w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="h-10 px-3 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Needs Review</option>
              <option value="evaluated">Evaluated</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        )}
      </div>

      {loading && view !== 'evaluation' ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500">Loading data...</p>
        </div>
      ) : (
        <>
          {/* ASSIGNMENTS VIEW */}
          {view === 'assignments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="cursor-pointer group"
                    onClick={() => handleAssignmentClick(assignment)}
                  >
                    <Card className="hover:shadow-lg transition-all border-none bg-white dark:bg-dark-800">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-xl ${assignment.subject?.color ? `bg-${assignment.subject.color}/10 text-${assignment.subject.color}-700` : 'bg-primary/10 text-primary-700'}`}>
                            <ClipboardList className="w-6 h-6" />
                          </div>
                          <Badge variant={assignment.status === 'CLOSED' ? 'secondary' : 'success'}>
                            {assignment.status}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-700 transition-colors">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                          {assignment.subject?.name} • {assignment.academicUnit?.name}
                        </p>

                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Submissions</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {assignment.stats?.submitted} / {assignment.stats?.totalStudents}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-dark-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary h-full rounded-full transition-all duration-500" 
                              style={{ width: `${assignment.stats?.submissionRate}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due {formatDate(assignment.dueDate)}
                            </span>
                            <span className="text-primary-700 font-medium">
                              {assignment.stats?.submitted - assignment.stats?.evaluated} pending
                            </span>
                          </div>
                        </div>

                        <Button className="w-full bg-primary hover:bg-primary-600 text-black border-none rounded-xl">
                          Review Submissions
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No assignments found</h3>
                  <p className="text-gray-500">You haven't published any assignments yet or none match your search.</p>
                </div>
              )}
            </div>
          )}

          {/* SUBMISSIONS VIEW */}
          {view === 'submissions' && (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Students"
                  value={submissionStats.total.toString()}
                  change="0%"
                  trend="up"
                  icon={Users}
                  color="bg-blue-500/10 text-blue-600"
                />
                <StatCard
                  title="Submitted"
                  value={submissionStats.submitted.toString()}
                  change="0%"
                  trend="up"
                  icon={FileText}
                  color="bg-amber-500/10 text-amber-600"
                />
                <StatCard
                  title="Evaluated"
                  value={submissionStats.evaluated.toString()}
                  change="0%"
                  trend="up"
                  icon={CheckCircle2}
                  color="bg-green-500/10 text-green-600"
                />
                <StatCard
                  title="Pending Review"
                  value={submissionStats.pending.toString()}
                  change="0%"
                  trend="up"
                  icon={Clock}
                  color="bg-primary/20 text-primary-700"
                />
              </div>

              {/* Submissions Table */}
              <Card className="border-none shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-dark-700/50 border-b border-gray-100 dark:border-dark-700">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Marks</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                      {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((submission) => (
                          <tr 
                            key={submission.id} 
                            className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-700 font-bold overflow-hidden">
                                  {submission.student.profilePhoto ? (
                                    <img src={submission.student.profilePhoto} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    submission.student.fullName.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {submission.student.fullName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {submission.student.admissionNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(submission.status)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {submission.submittedAt ? formatDate(submission.submittedAt) : '-'}
                              </div>
                              {submission.isLate && (
                                <div className="text-[10px] text-red-500 font-bold uppercase">Late Submission</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {submission.evaluation?.marksObtained !== null ? (
                                  `${submission.evaluation.marksObtained} / ${selectedAssignment?.maxMarks || '-'}`
                                ) : (
                                  <span className="text-gray-400">Not Graded</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={submission.status === 'PENDING'}
                                onClick={() => handleSubmissionClick(submission)}
                                className="text-primary-700 hover:text-primary-800 hover:bg-primary/10"
                              >
                                {submission.status === 'EVALUATED' ? 'View Grade' : 'Grade Now'}
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <p className="text-gray-500">No submissions found matching your filters.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* EVALUATION VIEW */}
          {view === 'evaluation' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Submission Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-700" />
                      Submission Content
                    </h3>
                    
                    <div className="bg-gray-50 dark:bg-dark-700/50 rounded-xl p-6 mb-6">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[100px]">
                        {selectedSubmission?.remarks || "No additional remarks provided by the student."}
                      </p>
                    </div>

                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                      Attachments ({selectedSubmission?.attachments?.length || 0})
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedSubmission?.attachments?.map((file: any) => (
                        <div 
                          key={file.id} 
                          className="flex items-center justify-between p-3 border border-gray-100 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 hover:border-primary transition-colors group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.fileName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(file.fileSize / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-primary/10 rounded-lg text-primary-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <a 
                              href={file.url} 
                              download={file.fileName}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Assignment Reference */}
                <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Assignment Reference</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Description</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                          {selectedAssignment?.description || 'No description provided.'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Instructions</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedAssignment?.instructions || 'No specific instructions.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Max Marks</h4>
                          <span className="text-sm font-bold text-primary-700">{selectedAssignment?.maxMarks || 'N/A'}</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Due Date</h4>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(selectedAssignment?.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Evaluation Form */}
              <div className="space-y-6">
                <Card className="border-none shadow-soft bg-white dark:bg-dark-800 sticky top-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary-700" />
                      Grading & Feedback
                    </h3>

                    <form onSubmit={handleEvaluationSubmit} className="space-y-6">
                      <Input
                        label={`Marks Obtained (Max: ${selectedAssignment?.maxMarks || 'N/A'})`}
                        type="number"
                        step="0.5"
                        placeholder="Enter marks"
                        value={evaluationForm.marksObtained}
                        onChange={(e) => setEvaluationForm({ ...evaluationForm, marksObtained: e.target.value })}
                        required={!!selectedAssignment?.maxMarks}
                      />

                      <Textarea
                        label="Teacher Feedback"
                        placeholder="Provide comments for the student..."
                        value={evaluationForm.feedback}
                        onChange={(e) => setEvaluationForm({ ...evaluationForm, feedback: e.target.value })}
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Action
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEvaluationForm({ ...evaluationForm, status: 'EVALUATED' })}
                            className={`px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all ${
                              evaluationForm.status === 'EVALUATED'
                                ? 'bg-primary/20 border-primary text-primary-900'
                                : 'bg-transparent border-gray-100 dark:border-dark-700 text-gray-500'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setEvaluationForm({ ...evaluationForm, status: 'RETURNED' })}
                            className={`px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all ${
                              evaluationForm.status === 'RETURNED'
                                ? 'bg-amber/20 border-amber-500 text-amber-900'
                                : 'bg-transparent border-gray-100 dark:border-dark-700 text-gray-500'
                            }`}
                          >
                            Return
                          </button>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          disabled={submitting}
                          className="w-full bg-primary hover:bg-primary-600 text-black border-none h-12 rounded-xl font-bold"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5 mr-2" />
                              Submit Evaluation
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex gap-3 text-sm">
                      <AlertCircle className="w-5 h-5 text-primary-700 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-primary-900">Grading Note</p>
                        <p className="text-primary-800/80">
                          Students will be notified once you submit the evaluation. If you return the submission, they can resubmit based on your feedback.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
