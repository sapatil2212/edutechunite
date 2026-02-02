'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  X,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AssignmentTypeBadge,
  SubmissionStatusBadge,
  getDueDateStatus,
  formatDate,
} from '@/components/assignments/AssignmentCard'

interface Attachment {
  id: string
  type: string
  url: string
  fileName?: string
  fileSize?: number
  mimeType?: string
}

interface Assignment {
  id: string
  title: string
  description?: string
  instructions?: string
  type: string
  category: string
  submissionMode: string
  maxMarks?: number
  dueDate: string
  dueTime?: string
  status: string
  allowLateSubmission: boolean
  allowResubmission: boolean
  academicUnit: { id: string; name: string }
  section?: { id: string; name: string }
  subject?: { id: string; name: string; color?: string }
  createdBy: { fullName: string }
  attachments: Attachment[]
  studentSubmission?: {
    id: string
    status: string
    isLate: boolean
    submittedAt?: string
    remarks?: string
    attachments: Attachment[]
    evaluation?: {
      marksObtained?: number
      feedback?: string
      evaluatedAt?: string
    }
  }
}

export default function StudentAssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>([])
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const fetchAssignment = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch(`/api/institution/assignments/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setAssignment(data.assignment)
        // If there's an existing submission that is returned/draft (not implemented yet, but for future), populate fields
        // But for now we just show previous submission below
      } else {
        setError(data.error || 'Failed to fetch assignment')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch assignment')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchAssignment()
    }
  }, [params.id])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError('')

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'submissions')

        const res = await fetch('/api/institution/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setUploadedFiles(prev => [...prev, {
            id: Date.now().toString(),
            type: 'FILE',
            url: data.url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }])
        } else {
          setError(data.error || `Failed to upload ${file.name}`)
        }
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!assignment) return

    if (assignment.submissionMode !== 'OFFLINE' && uploadedFiles.length === 0) {
      setError('Please upload at least one file')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/institution/assignments/${params.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remarks,
          attachments: uploadedFiles.map(f => ({
            url: f.url,
            fileName: f.fileName,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
          })),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitSuccess(true)
        setUploadedFiles([])
        setRemarks('')
        fetchAssignment() // Refresh to get updated submission
      } else {
        setError(data.error || 'Failed to submit assignment')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('Failed to submit assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  if (!assignment) return null

  const hasSubmitted = assignment.studentSubmission && ['SUBMITTED', 'LATE', 'EVALUATED'].includes(assignment.studentSubmission.status)
  // Allow resubmission if configured and not yet evaluated (or if logic allows)
  // My API allows resubmission if not evaluated OR if allowResubmission is true (even if evaluated? No, API blocked if evaluated unless allowed).
  // Let's match API logic: if evaluated, check allowResubmission.
  const isEvaluated = assignment.studentSubmission?.status === 'EVALUATED'
  const canSubmit = !hasSubmitted || (assignment.allowResubmission && (!isEvaluated || assignment.allowResubmission))
  
  // Actually, let's simplify: 
  // If not submitted: yes.
  // If submitted but not evaluated: yes (update/new version).
  // If evaluated: only if allowResubmission.
  
  const canResubmit = !isEvaluated || assignment.allowResubmission
  const showSubmitForm = canResubmit

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student/homework">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AssignmentTypeBadge type={assignment.type} />
            {assignment.studentSubmission && (
              <SubmissionStatusBadge 
                status={assignment.studentSubmission.status} 
                isLate={assignment.studentSubmission.isLate}
              />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {assignment.title}
          </h1>
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-medium">Assignment submitted successfully!</p>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assignment Details
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Due: {formatDate(assignment.dueDate)} {assignment.dueTime}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span className={getDueDateStatus(assignment.dueDate, assignment.dueTime).color}>
                  {getDueDateStatus(assignment.dueDate, assignment.dueTime).label}
                </span>
              </div>
              {assignment.maxMarks && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Star className="w-4 h-4" />
                  <span>Max Marks: {assignment.maxMarks}</span>
                </div>
              )}
            </div>

            {assignment.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {assignment.description}
                </p>
              </div>
            )}

            {assignment.instructions && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                    {assignment.instructions}
                  </p>
                </div>
              </div>
            )}

            {/* Teacher Attachments */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attached Resources
                </h3>
                <div className="space-y-2">
                  {assignment.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {att.fileName || 'Attachment'}
                        </span>
                      </div>
                      <Download className="w-4 h-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Submission Form */}
          {showSubmitForm && assignment.submissionMode !== 'OFFLINE' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {hasSubmitted ? 'Resubmit Assignment' : 'Your Submission'}
                </h2>
              </div>

              <div className="space-y-4">
                {/* File Upload */}
                <label className="block">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip"
                  />
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-dark-700 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, DOC, DOCX, JPG, PNG, ZIP (Max 10MB each)
                    </p>
                  </div>
                </label>

                {/* Uploaded Files (Draft) */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Files to Submit ({uploadedFiles.length})
                    </h4>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                            {file.fileName}
                          </span>
                          {file.fileSize && (
                            <span className="text-xs text-gray-400">
                              ({(file.fileSize / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add a note (optional)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg resize-none"
                    placeholder="Any additional notes for your teacher..."
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (assignment.submissionMode !== 'OFFLINE' && uploadedFiles.length === 0)}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {hasSubmitted ? 'Resubmit Assignment' : 'Submit Assignment'}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Previous/Current Submission Display */}
          {assignment.studentSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Submitted Work
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                  <span className="text-gray-900 dark:text-white">
                    {assignment.studentSubmission.submittedAt && formatDate(assignment.studentSubmission.submittedAt)}
                  </span>
                  {assignment.studentSubmission.isLate && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                      Late
                    </span>
                  )}
                </div>

                {assignment.studentSubmission.remarks && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {assignment.studentSubmission.remarks}
                    </p>
                  </div>
                )}

                {assignment.studentSubmission.attachments && assignment.studentSubmission.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Submitted Files</h4>
                    <div className="space-y-2">
                      {assignment.studentSubmission.attachments.map((att: Attachment) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {att.fileName || 'Attachment'}
                            </span>
                          </div>
                          <Download className="w-4 h-4 text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Evaluation / Feedback */}
                {assignment.studentSubmission.evaluation && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-700">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Teacher Feedback</h3>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Marks Obtained</span>
                         <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                           {assignment.studentSubmission.evaluation.marksObtained} / {assignment.maxMarks}
                         </span>
                      </div>
                      
                      {assignment.studentSubmission.evaluation.feedback && (
                        <div>
                          <span className="text-xs font-medium uppercase tracking-wider text-blue-800/60 dark:text-blue-400/60 block mb-1">
                            Comments
                          </span>
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            {assignment.studentSubmission.evaluation.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
