'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  Loader2,
  ChevronRight,
  Plus,
  AlertCircle,
  BookOpen,
  MapPin,
  FileBarChart,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Exam {
  id: string
  name: string
  examType: string
  startDate: string
  endDate: string
  status: string
  academicYear: { name: string }
  schedules: any[]
  _count: { results: number }
}

export default function TeacherExamsPage() {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/institution/exams')
      const data = await res.json()
      if (data.exams) {
        setExams(data.exams)
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Badge variant="info">Scheduled</Badge>
      case 'ONGOING': return <Badge variant="warning">Ongoing</Badge>
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>
      case 'RESULTS_PUBLISHED': return <Badge variant="primary">Results Published</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Examinations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View upcoming exams, manage schedules, and enter student results
          </p>
        </div>
      </div>

      {exams.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {exams.map((exam) => (
            <Card 
              key={exam.id} 
              className="border-none shadow-soft overflow-hidden bg-white dark:bg-dark-800"
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-7 h-7 text-primary-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {exam.name}
                          </h3>
                          {getStatusBadge(exam.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="capitalize">
                              {exam.examType.replace(/_/g, ' ').toLowerCase()}
                            </Badge>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link href={`/teacher/exams/${exam.id}/results`}>
                        <Button className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold">
                          <FileBarChart className="w-4 h-4 mr-2" />
                          Enter Results
                        </Button>
                      </Link>
                      <Button variant="ghost" className="rounded-xl border border-gray-100 dark:border-dark-700">
                        View Schedule
                      </Button>
                    </div>
                  </div>

                  {/* Quick Schedule Preview */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exam.schedules.slice(0, 3).map((schedule: any) => (
                      <div 
                        key={schedule.id} 
                        className="p-4 bg-gray-50 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-gray-400 uppercase">{formatDate(schedule.examDate)}</span>
                          <Badge variant="secondary" className="text-[10px]">{schedule.startTime}</Badge>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                          {schedule.subject.name}
                        </h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {schedule.academicUnit.name}
                        </p>
                      </div>
                    ))}
                    {exam.schedules.length > 3 && (
                      <div className="flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-100 dark:border-dark-700">
                        <span className="text-xs font-bold text-gray-400">+{exam.schedules.length - 3} more subjects</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-soft py-20 text-center bg-white dark:bg-dark-800">
          <CardContent>
            <div className="w-20 h-20 bg-gray-50 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Exams Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              There are no examinations scheduled at the moment. Check back later or contact administration.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
