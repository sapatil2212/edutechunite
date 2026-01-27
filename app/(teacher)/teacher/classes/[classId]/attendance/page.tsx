'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  ArrowLeft,
  Check,
  X,
  Clock,
  AlertCircle,
  Calendar,
  Save,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Users,
  Loader2,
} from 'lucide-react'

interface Student {
  id: string
  studentId: string // alias for admissionNumber
  admissionNumber?: string
  rollNumber: string | null
  firstName: string
  lastName: string
  fullName?: string
  profilePhoto: string | null
  attendance: {
    id: string
    status: string
    remarks: string | null
  } | null
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  notMarked: number
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

export default function ClassAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const classId = params?.classId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (classId) {
      fetchAttendance()
    }
  }, [classId, selectedDate])

  const fetchAttendance = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/institution/teachers/my-classes/${classId}/attendance?date=${selectedDate}`)
      const data = await res.json()
      
      if (data.success) {
        setStudents(data.data.students || [])
        setSummary(data.data.summary)
        
        // Initialize attendance map from existing records
        const map: Record<string, AttendanceStatus> = {}
        const remarks: Record<string, string> = {}
        data.data.students.forEach((s: Student) => {
          if (s.attendance) {
            map[s.id] = s.attendance.status as AttendanceStatus
            if (s.attendance.remarks) {
              remarks[s.id] = s.attendance.remarks
            }
          }
        })
        setAttendanceMap(map)
        setRemarksMap(remarks)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }))
    setHasChanges(true)
  }

  const handleMarkAllPresent = () => {
    const map: Record<string, AttendanceStatus> = {}
    students.forEach(s => { map[s.id] = 'PRESENT' })
    setAttendanceMap(map)
    setHasChanges(true)
  }

  const handleSaveAttendance = async () => {
    setIsSaving(true)
    try {
      const attendance = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status,
        remarks: remarksMap[studentId] || null,
      }))

      const res = await fetch(`/api/institution/teachers/my-classes/${classId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, attendance }),
      })

      const data = await res.json()
      if (data.success) {
        setHasChanges(false)
        fetchAttendance() // Refresh data
      }
    } catch (error) {
      console.error('Failed to save attendance:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const getStatusBadge = (status: AttendanceStatus | undefined) => {
    if (!status) return null
    const config: Record<AttendanceStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' }> = {
      PRESENT: { label: 'Present', variant: 'success' },
      ABSENT: { label: 'Absent', variant: 'danger' },
      LATE: { label: 'Late', variant: 'warning' },
      EXCUSED: { label: 'Excused', variant: 'info' },
    }
    const { label, variant } = config[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/teacher/classes/${classId}/students`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Mark Attendance
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update daily attendance for your class students
            </p>
          </div>
          {hasChanges && (
            <Button
              onClick={handleSaveAttendance}
              disabled={isSaving}
              className="shadow-lg shadow-primary/20"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Date Selector & Summary Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="bg-transparent border-0 text-sm font-bold text-gray-900 dark:text-white focus:ring-0 p-0"
              />
            </div>
            <button
              onClick={() => navigateDate(1)}
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
  
          {/* Summary Stats */}
          {summary && (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success">
                P: {summary.present}
              </Badge>
              <Badge variant="danger">
                A: {summary.absent}
              </Badge>
              <Badge variant="warning">
                L: {summary.late}
              </Badge>
              <Badge variant="info">
                E: {summary.excused}
              </Badge>
              <Badge variant="secondary">
                NM: {summary.notMarked}
              </Badge>
            </div>
          )}
        </div>

        {/* Quick Action */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllPresent}
          className="text-primary-700 border-primary/30 hover:bg-primary/10 transition-colors font-bold"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark All Present
        </Button>
      </div>

      {/* Attendance Table */}
      <Card className="overflow-hidden">
        {students.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No students found in this class</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-dark-800/50">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                  Roll
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Status
                </th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {students.map((student, index) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-gray-50/50 dark:hover:bg-dark-800/30 transition-colors"
                >
                  {/* Roll Number */}
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-800 text-xs font-bold text-gray-600 dark:text-gray-400">
                      {student.rollNumber || index + 1}
                    </span>
                  </td>

                  {/* Student Info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white dark:border-dark-700 shadow-sm">
                        {student.profilePhoto ? (
                          <img 
                            src={student.profilePhoto} 
                            alt={`${student.firstName} ${student.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary-700 dark:text-primary-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {student.fullName || `${student.firstName} ${student.lastName}`}
                        </p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {student.studentId || student.admissionNumber}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Current Status */}
                  <td className="py-4 px-6">
                    {getStatusBadge(attendanceMap[student.id])}
                    {!attendanceMap[student.id] && (
                      <span className="text-xs text-gray-400 italic font-medium">Not marked</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleStatusChange(student.id, 'PRESENT')}
                        title="Present"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          attendanceMap[student.id] === 'PRESENT'
                            ? 'bg-primary text-dark-900 shadow-lg shadow-primary/30'
                            : 'bg-gray-50 dark:bg-dark-800 text-gray-400 hover:bg-primary/10 hover:text-primary-700'
                        }`}
                      >
                        <Check className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'ABSENT')}
                        title="Absent"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          attendanceMap[student.id] === 'ABSENT'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-none'
                            : 'bg-gray-50 dark:bg-dark-800 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                        }`}
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'LATE')}
                        title="Late"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          attendanceMap[student.id] === 'LATE'
                            ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-200 dark:shadow-none'
                            : 'bg-gray-50 dark:bg-dark-800 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400'
                        }`}
                      >
                        <Clock className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                        title="Excused"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          attendanceMap[student.id] === 'EXCUSED'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                            : 'bg-gray-50 dark:bg-dark-800 text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                        }`}
                      >
                        <AlertCircle className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Table Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Showing {students.length} students</span>
        {hasChanges && (
          <span className="text-primary-700 dark:text-primary-400 font-medium">You have unsaved changes</span>
        )}
      </div>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            size="lg"
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="rounded-full shadow-2xl shadow-primary/40 px-8 py-6 h-auto text-lg font-bold"
          >
            <Save className="w-6 h-6 mr-3" />
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      )}
    </>
  )
}
