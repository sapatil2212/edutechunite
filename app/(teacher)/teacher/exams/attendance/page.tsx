'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExamAttendance {
  id: string
  examName: string
  date: string
  startTime: string
  endTime: string
  subject: {
    name: string
    code: string
  }
  academicUnit: {
    name: string
    parent?: {
      name: string
    }
  }
  totalStudents: number
  presentCount: number
  absentCount: number
  status: 'PENDING' | 'COMPLETED'
}

export default function TeacherExamAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [attendanceList, setAttendanceList] = useState<ExamAttendance[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExamAttendance()
  }, [])

  const fetchExamAttendance = async () => {
    try {
      setLoading(true)
      setError(null)
      // TODO: Implement actual API call
      // const response = await fetch('/api/teacher/exams/attendance')
      // const data = await response.json()
      // setAttendanceList(data.attendance || [])
      setAttendanceList([])
    } catch (error) {
      console.error('Error fetching exam attendance:', error)
      setError('Failed to load exam attendance')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Exam Attendance
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mark and view exam attendance for your invigilation duties
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : attendanceList.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No exam attendance records found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {attendanceList.map((exam) => (
            <div
              key={exam.id}
              className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {exam.subject.name} ({exam.subject.code})
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exam.academicUnit.parent?.name ? `${exam.academicUnit.parent.name} - ` : ''}
                    {exam.academicUnit.name}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  exam.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {exam.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {new Date(exam.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  {exam.startTime} - {exam.endTime}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{exam.totalStudents}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{exam.presentCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Present</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{exam.absentCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Absent</div>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  className="w-full"
                  disabled={exam.status === 'COMPLETED'}
                >
                  {exam.status === 'COMPLETED' ? 'Attendance Marked' : 'Mark Attendance'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
