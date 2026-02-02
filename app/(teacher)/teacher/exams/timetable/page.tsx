'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExamTimetable {
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
  room?: string
  invigilators?: {
    fullName: string
  }[]
}

export default function TeacherExamTimetablePage() {
  const [loading, setLoading] = useState(true)
  const [timetables, setTimetables] = useState<ExamTimetable[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExamTimetable()
  }, [])

  const fetchExamTimetable = async () => {
    try {
      setLoading(true)
      setError(null)
      // TODO: Implement actual API call
      // const response = await fetch('/api/teacher/exams/timetable')
      // const data = await response.json()
      // setTimetables(data.timetables || [])
      setTimetables([])
    } catch (error) {
      console.error('Error fetching exam timetable:', error)
      setError('Failed to load exam timetable')
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
            Exam Timetable
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View exam schedules for classes you teach
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Calendar className="w-4 h-4 mr-2" />
          Print Timetable
        </Button>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : timetables.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No exam timetable available</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {timetables.map((exam) => (
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
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {exam.examName}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {exam.room && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    Room {exam.room}
                  </div>
                )}
              </div>
              {exam.invigilators && exam.invigilators.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Invigilators: {exam.invigilators.map(i => i.fullName).join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
