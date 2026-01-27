'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Search, 
  Loader2, 
  AlertCircle,
  Trophy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Exam {
  id: string
  name: string
  examType: string
  startDate: string
  endDate: string
  status: string
  description: string | null
  schedules: Array<{
    id: string
    subject: { name: string; code: string }
    examDate: string
    startTime: string
    endTime: string
    duration: number
    room: string | null
    maxMarks: number
    passingMarks: number
  }>
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedExam, setExpandedExam] = useState<string | null>(null)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/institution/exams')
      const data = await res.json()
      setExams(data.exams || [])
      if (data.exams?.length > 0) {
        setExpandedExam(data.exams[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExams = exams.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Examinations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track upcoming schedules and exam results</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search exams..." 
            className="pl-10 rounded-xl border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredExams.map((exam) => (
          <Card key={exam.id} className="border-none shadow-soft overflow-hidden group">
            <div 
              className="p-6 cursor-pointer"
              onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg ${
                    exam.status === 'SCHEDULED' ? 'bg-blue-500' :
                    exam.status === 'ONGOING' ? 'bg-green-500 animate-pulse' :
                    'bg-gray-500'
                  }`}>
                    <span className="text-[10px] font-bold opacity-80 uppercase leading-none mb-1">
                      {new Date(exam.startDate).toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-xl font-black">
                      {new Date(exam.startDate).getDate()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                        {exam.name}
                      </h3>
                      <Badge variant={
                        exam.status === 'SCHEDULED' ? 'primary' :
                        exam.status === 'ONGOING' ? 'success' :
                        'secondary'
                      } className="font-bold uppercase tracking-wider text-[10px]">
                        {exam.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {exam.schedules.length} Subjects
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <button className="p-2 rounded-xl bg-gray-50 dark:bg-dark-900 text-gray-400 group-hover:text-primary-600 transition-all">
                    {expandedExam === exam.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {expandedExam === exam.id && (
              <CardContent className="p-0 border-t border-gray-50 dark:border-dark-800">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-dark-900/50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                      {exam.schedules.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900 dark:text-white">{schedule.subject.name}</div>
                            <div className="text-xs text-gray-500 font-medium">{schedule.subject.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {new Date(schedule.examDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Badge variant="secondary" className="font-bold text-gray-500">{schedule.duration} Min</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300">
                              <MapPin className="w-3.5 h-3.5 text-primary-500" />
                              {schedule.room || 'TBA'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Max / Pass</div>
                            <div className="text-sm font-black text-gray-900 dark:text-white">
                              {schedule.maxMarks} / <span className="text-primary-600">{schedule.passingMarks}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 bg-gray-50/50 dark:bg-dark-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Please report at least 30 minutes before the scheduled time.
                  </div>
                  <button className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white dark:text-black rounded-xl text-xs font-black hover:bg-primary-600 transition-all shadow-soft">
                    <Download className="w-3.5 h-3.5" />
                    DOWNLOAD ADMIT CARD
                  </button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredExams.length === 0 && (
        <Card className="border-none shadow-soft p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No exams scheduled</h3>
          <p className="text-gray-500 dark:text-gray-400">There are no upcoming or active examinations at the moment.</p>
        </Card>
      )}
    </div>
  )
}
