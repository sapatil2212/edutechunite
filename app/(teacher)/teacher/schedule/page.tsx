'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  MapPin, 
  Users, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const formatDate = (date: Date, formatStr: string) => {
  if (formatStr === 'EEEE') {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
  }
  if (formatStr === 'MMMM d, yyyy') {
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
  }
  return date.toDateString()
}

const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export default function TeacherSchedulePage() {
  const [loading, setLoading] = useState(true)
  const [scheduleData, setScheduleData] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/institution/timetable/my-schedule')
      const data = await res.json()
      if (data.success) {
        setScheduleData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedDayName = formatDate(selectedDate, 'EEEE').toUpperCase()
  const todaySchedule = scheduleData?.schedule?.[selectedDayName] || []

  const sortedSchedule = useMemo(() => {
    return [...todaySchedule].sort((a, b) => a.periodNumber - b.periodNumber)
  }, [todaySchedule])

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
            Class Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your daily teaching assignments and periods
          </p>
        </div>
        <div className="flex items-center bg-white dark:bg-dark-800 p-1.5 rounded-2xl shadow-soft">
          <button 
            onClick={() => setSelectedDate(prev => addDays(prev, -1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-6 py-1 text-center min-w-[160px]">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {formatDate(selectedDate, 'EEEE')}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(selectedDate, 'MMMM d, yyyy')}
            </div>
          </div>
          <button 
            onClick={() => setSelectedDate(prev => addDays(prev, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Schedule Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {sortedSchedule.length > 0 ? (
            sortedSchedule.map((slot: any, index: number) => {
              const timing = scheduleData?.periodTimings?.[slot.periodNumber]
              return (
                <Card 
                  key={slot.id} 
                  className="border-none shadow-soft hover:shadow-lg transition-all duration-300 bg-white dark:bg-dark-800 overflow-hidden group"
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-32 bg-gray-50 dark:bg-dark-900 p-4 flex flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-dark-700">
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Period</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{slot.periodNumber}</span>
                        {timing && (
                          <div className="mt-2 text-[10px] font-bold text-primary-700 dark:text-primary-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timing.startTime}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-700 transition-colors">
                                {slot.subject?.name}
                              </h3>
                              <Badge variant="secondary" className="font-bold">
                                {slot.subject?.code}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary-700" />
                              {slot.academicUnit?.parent?.name} - {slot.academicUnit?.name}
                            </p>
                          </div>
                          {timing && (
                            <div className="px-4 py-2 bg-primary/10 rounded-xl text-primary-700 font-bold text-sm border border-primary/20">
                              {timing.startTime} - {timing.endTime}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50 dark:border-dark-700">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span>Room: {slot.room || 'Main Classroom'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                            <span>Academic View</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="border-none shadow-soft py-20 text-center bg-white dark:bg-dark-800">
              <CardContent>
                <div className="w-20 h-20 bg-gray-50 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Classes Scheduled</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  You don't have any classes scheduled for {formatDate(selectedDate, 'EEEE')}. Enjoy your free time!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Stats & Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-soft bg-white dark:bg-dark-800 overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-700" />
                Workload Stats
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Weekly Load</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{scheduleData?.stats?.weeklyLoad || 0}</span>
                  </div>
                  <p className="text-xs text-gray-400">Total periods assigned per week</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Classes</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{scheduleData?.stats?.totalClasses || 0}</span>
                  </div>
                  <p className="text-xs text-gray-400">Unique classes taught</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft bg-primary/5">
            <CardContent className="p-6">
              <h4 className="font-bold text-primary-900 mb-2">Quick Tip</h4>
              <p className="text-sm text-primary-800/80 leading-relaxed">
                Click on "View Profile" in the Students section to see more details about students in your classes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
