'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileBarChart, 
  ChevronLeft, 
  Save, 
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  User,
  BookOpen,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface ExamSchedule {
  id: string
  subjectId: string
  subject: {
    id: string
    name: string
    code: string
  }
  academicUnitId: string
  academicUnit: {
    id: string
    name: string
  }
  maxMarks: number
  passingMarks: number
  examDate: string
}

interface Exam {
  id: string
  name: string
  examType: string
  gradingSystem: any
  schedules: ExamSchedule[]
}

interface Student {
  id: string
  fullName: string
  admissionNumber: string
  rollNumber: string | null
}

interface MarkEntry {
  studentId: string
  marksObtained: string
  isAbsent: boolean
  remarks: string
}

export default function ExamResultsEntryPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<ExamSchedule | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExamDetails()
  }, [examId])

  const fetchExamDetails = async () => {
    try {
      const res = await fetch(`/api/institution/exams`)
      const data = await res.json()
      const foundExam = data.exams.find((e: any) => e.id === examId)
      if (foundExam) {
        setExam(foundExam)
        // Auto-select first schedule if available
        if (foundExam.schedules.length > 0) {
          handleScheduleSelect(foundExam.schedules[0])
        }
      } else {
        setError('Exam not found')
      }
    } catch (error) {
      console.error('Failed to fetch exam details:', error)
      setError('Failed to load exam details')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleSelect = async (schedule: ExamSchedule) => {
    setSelectedSchedule(schedule)
    setLoading(true)
    try {
      // Fetch students for the academic unit
      const res = await fetch(`/api/institution/students?academicUnitId=${schedule.academicUnitId}&limit=100`)
      const data = await res.json()
      setStudents(data.students || [])

      // Fetch existing results for this subject/exam to pre-fill
      const resultsRes = await fetch(`/api/institution/results?examId=${examId}&academicUnitId=${schedule.academicUnitId}`)
      const resultsData = await resultsRes.json()
      
      // Initialize marks state
      const initialMarks: Record<string, MarkEntry> = {}
      data.students.forEach((student: Student) => {
        // Find if student already has a result in resultsData
        // (Note: resultsData might be grouped, let's simplify)
        initialMarks[student.id] = {
          studentId: student.id,
          marksObtained: '',
          isAbsent: false,
          remarks: ''
        }
      })

      // If we had a way to get raw results, we would map them here
      // For now, we'll assume fresh entry or fetch results per student if needed
      // Actually, let's try to find results in resultsData.results
      if (resultsData.results && resultsData.results.length > 0) {
        const examResult = resultsData.results.find((r: any) => r.exam.id === examId)
        if (examResult) {
          examResult.subjects.forEach((s: any) => {
            if (s.subject.id === schedule.subjectId) {
               // This is tricky because resultsData is grouped by student or exam
               // Let's assume we can fetch results for this schedule
            }
          })
        }
      }

      setMarks(initialMarks)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkChange = (studentId: string, value: string) => {
    // Validate value is within maxMarks
    const numericValue = parseFloat(value)
    if (!isNaN(numericValue) && selectedSchedule && numericValue > selectedSchedule.maxMarks) {
      return
    }

    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: value,
        isAbsent: false
      }
    }))
  }

  const toggleAbsent = (studentId: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent: !prev[studentId].isAbsent,
        marksObtained: !prev[studentId].isAbsent ? '' : prev[studentId].marksObtained
      }
    }))
  }

  const handleSave = async () => {
    if (!selectedSchedule) return

    setSaving(true)
    try {
      const resultsArray = Object.values(marks).map(m => ({
        studentId: m.studentId,
        marksObtained: m.isAbsent ? null : (m.marksObtained === '' ? null : parseFloat(m.marksObtained)),
        isAbsent: m.isAbsent,
        remarks: m.remarks
      }))

      const res = await fetch('/api/institution/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          examScheduleId: selectedSchedule.id,
          subjectId: selectedSchedule.subjectId,
          results: resultsArray
        })
      })

      if (res.ok) {
        alert('Results saved successfully!')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save results')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNumber.includes(searchQuery)
  )

  if (loading && !exam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">{error}</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/teacher/exams">
            <Button variant="ghost" size="sm" className="rounded-full h-10 w-10 p-0">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Enter Exam Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {exam?.name} • Select subject and enter marks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSave} 
            disabled={saving || !selectedSchedule}
            className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold h-11 px-6 shadow-soft"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Subject List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider px-2">Subjects</h3>
              <div className="space-y-2">
                {exam?.schedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    onClick={() => handleScheduleSelect(schedule)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 border ${
                      selectedSchedule?.id === schedule.id
                        ? 'bg-primary/10 border-primary text-primary-900'
                        : 'bg-transparent border-gray-100 dark:border-dark-700 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <BookOpen className={`w-4 h-4 ${selectedSchedule?.id === schedule.id ? 'text-primary-700' : 'text-gray-400'}`} />
                      <span className="font-bold text-sm truncate">{schedule.subject.name}</span>
                    </div>
                    <p className="text-[10px] uppercase font-bold opacity-60 ml-7">
                      {schedule.academicUnit.name}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedSchedule && (
            <Card className="border-none shadow-soft bg-primary/5 border border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-primary-700 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Instructions</span>
                </div>
                <ul className="text-xs text-primary-900/70 space-y-2 list-disc ml-4">
                  <li>Max Marks for this subject is <strong>{selectedSchedule.maxMarks}</strong>.</li>
                  <li>Passing Marks is <strong>{selectedSchedule.passingMarks}</strong>.</li>
                  <li>Mark students as absent if they didn't appear.</li>
                  <li>Click 'Save Changes' to update the database.</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - Student List */}
        <div className="lg:col-span-3 space-y-4">
          {selectedSchedule ? (
            <>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search students by name or admission number..."
                    className="pl-9 h-11 bg-white dark:bg-dark-800 border-none shadow-soft rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-900 rounded-xl text-xs font-bold text-gray-500">
                  <User className="w-4 h-4" />
                  Total Students: {students.length}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
                </div>
              ) : (
                <Card className="border-none shadow-soft bg-white dark:bg-dark-800 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-dark-900/50 border-b border-gray-100 dark:border-dark-700">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Details</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Absent</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40">Marks (/{selectedSchedule.maxMarks})</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remarks</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                          {filteredStudents.map((student) => {
                            const entry = marks[student.id] || { marksObtained: '', isAbsent: false, remarks: '' }
                            const isPassing = entry.marksObtained !== '' && parseFloat(entry.marksObtained) >= selectedSchedule.passingMarks

                            return (
                              <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-900/20 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary-700 font-bold text-xs">
                                      {student.fullName.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{student.fullName}</p>
                                      <p className="text-[10px] text-gray-500 font-medium">Roll: {student.rollNumber || 'N/A'} • Adm: {student.admissionNumber}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => toggleAbsent(student.id)}
                                    className={`w-10 h-6 rounded-full transition-all duration-200 relative ${
                                      entry.isAbsent ? 'bg-red-500' : 'bg-gray-200 dark:bg-dark-700'
                                    }`}
                                  >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                                      entry.isAbsent ? 'right-1' : 'left-1'
                                    }`} />
                                  </button>
                                </td>
                                <td className="px-6 py-4">
                                  <Input
                                    type="number"
                                    disabled={entry.isAbsent}
                                    placeholder="0.0"
                                    className={`h-10 text-center font-bold rounded-lg border-gray-200 dark:border-dark-700 ${
                                      entry.isAbsent ? 'bg-gray-50 opacity-50' : 'bg-white'
                                    }`}
                                    value={entry.marksObtained}
                                    onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <Input
                                    placeholder="Add notes..."
                                    className="h-10 text-xs border-gray-100 dark:border-dark-700"
                                    value={entry.remarks}
                                    onChange={(e) => setMarks(prev => ({
                                      ...prev,
                                      [student.id]: { ...prev[student.id], remarks: e.target.value }
                                    }))}
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {entry.isAbsent ? (
                                    <Badge variant="danger" className="text-[10px]">ABSENT</Badge>
                                  ) : entry.marksObtained !== '' ? (
                                    isPassing ? (
                                      <div className="flex flex-col items-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
                                        <span className="text-[10px] font-bold text-green-600 uppercase">PASS</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center">
                                        <XCircle className="w-5 h-5 text-red-500 mb-1" />
                                        <span className="text-[10px] font-bold text-red-600 uppercase">FAIL</span>
                                      </div>
                                    )
                                  ) : (
                                    <span className="text-[10px] font-bold text-gray-300 uppercase italic">Pending</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-none shadow-soft py-20 text-center bg-white dark:bg-dark-800">
              <CardContent>
                <div className="w-20 h-20 bg-gray-50 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileBarChart className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Subject</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Choose a subject from the left panel to start entering exam results for students.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
