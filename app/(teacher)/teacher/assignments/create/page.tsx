'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Loader2,
  CheckCircle2,
  Paperclip,
  Link as LinkIcon,
  X,
  Upload,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface AssignedClass {
  id: string
  name: string
  studentCount: number
  subjects: Array<{ id: string; name: string; color: string | null }>
  sections?: Array<{ id: string; name: string; studentCount: number }>
}

export default function CreateAssignmentPage() {
  const router = useRouter()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([])
  
  // Attachments state
  const [attachments, setAttachments] = useState<any[]>([])
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form state
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
    fetchTeacherClasses()
  }, [])

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'assignments')

      const response = await fetch('/api/institution/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setAttachments([...attachments, {
            type: 'FILE',
            title: file.name,
            url: data.url
        }])
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.academicUnitId || !formData.subjectId) {
      alert('Please select a class and subject')
      return
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
        router.push('/teacher/assignments')
      } else {
        alert(data.error || 'Failed to create assignment')
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedClass = assignedClasses.find(c => c.id === formData.academicUnitId)
  
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-full h-10 w-10 p-0">
            <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Assignment
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
            Fill in the details to publish or save as draft
            </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Assignment Title</Label>
              <Input
                id="title"
                required
                placeholder="e.g., Chapter 1: Introduction to Algebra"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="h-12 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary text-lg"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Brief Description (Visible in list)</Label>
              <Input
                id="description"
                placeholder="Short summary of the assignment..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="h-12 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instructions" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Detailed Instructions</Label>
            <textarea
              id="instructions"
              rows={6}
              placeholder="Provide step-by-step guidelines for the students..."
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              className="w-full rounded-xl border-none bg-gray-50 dark:bg-gray-900 p-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Target Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
          <div>
            <Label className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-2 block">Class</Label>
            <Select 
              options={classOptions}
              value={formData.academicUnitId} 
              onChange={(val) => setFormData({...formData, academicUnitId: val, sectionId: 'all', subjectId: ''})}
              placeholder="Select Class"
            />
          </div>

          <div>
            <Label className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-2 block">Subject</Label>
            <Select 
              options={subjectOptions}
              value={formData.subjectId} 
              onChange={(val) => setFormData({...formData, subjectId: val})}
              disabled={!formData.academicUnitId}
              placeholder="Select Subject"
            />
          </div>

          <div>
            <Label className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-2 block">Type</Label>
            <Select 
              options={assignmentTypeOptions}
              value={formData.type} 
              onChange={(val) => setFormData({...formData, type: val})}
              placeholder="Select Type"
            />
          </div>

          <div>
            <Label className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-2 block">Section</Label>
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
            <Label htmlFor="dueDate" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Due Date</Label>
            <Input
              id="dueDate"
              required
              type="date"
              value={formData.dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="h-11 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary"
            />
          </div>
          <div>
            <Label htmlFor="dueTime" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Due Time</Label>
            <Input
              id="dueTime"
              type="time"
              value={formData.dueTime}
              onChange={(e) => setFormData({...formData, dueTime: e.target.value})}
              className="h-11 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary"
            />
          </div>
          <div>
            <Label htmlFor="maxMarks" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Max Marks (Optional)</Label>
            <Input
              id="maxMarks"
              type="number"
              placeholder="Not graded"
              value={formData.maxMarks}
              onChange={(e) => setFormData({...formData, maxMarks: e.target.value})}
              className="h-11 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Settings & Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Submission Mode</Label>
            <Select 
              options={submissionModeOptions}
              value={formData.submissionMode} 
              onChange={(val) => setFormData({...formData, submissionMode: val})}
            />
          </div>
          <div className="flex items-center gap-6 pb-3">
            <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={formData.allowLateSubmission}
                onChange={(e) => setFormData({...formData, allowLateSubmission: e.target.checked})}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Late Submission</span>
            </label>
          </div>
        </div>

        {/* Scheduling Section */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Publishing Status:</Label>
            <div className="flex gap-2">
              {['PUBLISHED', 'DRAFT', 'SCHEDULED'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, status: s})}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    formData.status === s 
                      ? 'bg-primary text-dark-900 shadow-md transform scale-105' 
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
              className="grid grid-cols-2 gap-4 mt-4"
            >
              <div>
                <Label className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Release Date</Label>
                <Input 
                  type="date" 
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({...formData, scheduledFor: e.target.value})}
                  className="bg-white dark:bg-gray-800 h-10" 
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Release Time</Label>
                <Input 
                  type="time" 
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                  className="bg-white dark:bg-gray-800 h-10" 
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attachments & Resources</Label>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowLinkInput(!showLinkInput)}
              className="text-primary-700 dark:text-primary-400 h-9"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          </div>

          {showLinkInput && (
            <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl animate-in fade-in slide-in-from-top-2">
              <Input 
                placeholder="Link Title" 
                value={newLink.title} 
                onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                className="flex-1 h-10"
              />
              <Input 
                placeholder="https://..." 
                value={newLink.url} 
                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                className="flex-[2] h-10"
              />
              <Button type="button" onClick={addLink} size="sm" variant="primary" className="h-10 px-6">Add</Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attachments.map((at, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {at.type === 'LINK' ? <LinkIcon className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{at.title}</p>
                    <p className="text-xs text-gray-500 truncate">{at.url}</p>
                  </div>
                </div>
                <button type="button" onClick={() => removeAttachment(idx)} className="p-2 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="relative">
                <Input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="assignment-file-upload"
                    disabled={isUploading}
                    multiple
                />
                <label 
                    htmlFor="assignment-file-upload"
                    className={`flex flex-col items-center justify-center h-[72px] border-dashed border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center text-primary">
                            <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                            <span className="text-xs font-bold">Uploading...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-gray-500 hover:text-primary-700">
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-xs font-bold">Upload Document / Image</span>
                        </div>
                    )}
                </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 flex items-center justify-end gap-4 border-t border-gray-100 dark:border-gray-700">
            <Button 
                type="button"
                variant="ghost" 
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="h-12 px-6"
            >
                Cancel
            </Button>
            <Button 
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="min-w-[180px] h-12 shadow-lg shadow-primary/20 text-base font-bold"
            >
                {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                    <><CheckCircle2 className="w-5 h-5 mr-2" /> {formData.status === 'PUBLISHED' ? 'Publish Assignment' : 'Save as ' + formData.status.toLowerCase()}</>
                )}
            </Button>
        </div>
      </form>
    </div>
  )
}
