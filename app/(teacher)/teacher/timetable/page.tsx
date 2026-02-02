'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Loader2,
  Printer,
  AlertCircle,
  User,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

interface TimetableData {
  schedule: Record<string, any[]>;
  periodTimings: Record<number, any>;
  message?: string;
}

export default function TeacherTimetablePage() {
  const [loading, setLoading] = useState(true)
  const [scheduleData, setScheduleData] = useState<TimetableData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/institution/timetable/my-schedule')
      const data = await res.json()
      if (data.success && data.data) {
        setScheduleData(data.data)
      } else if (data.data?.message) {
        setError(data.data.message)
      } else {
        setError('Failed to load timetable')
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
      setError('Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  const periods = scheduleData?.periodTimings 
    ? Object.entries(scheduleData.periodTimings).sort(([a], [b]) => parseInt(a) - parseInt(b))
    : []

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
            My Timetable
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View your weekly teaching schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>

      {error ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
          <p className="text-yellow-600 dark:text-yellow-400">{error}</p>
        </div>
      ) : !scheduleData || periods.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No timetable available</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Period
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {periods.map(([periodNum, timing]: [string, any]) => (
                  <tr key={periodNum}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Period {periodNum}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {timing.startTime} - {timing.endTime}
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const slot = scheduleData?.schedule?.[day]?.find((s: any) => s.periodNumber === parseInt(periodNum))
                      return (
                        <td key={`${day}-${periodNum}`} className="px-2 py-2">
                          {timing.isBreak ? (
                            <div className="p-3 bg-gray-100 dark:bg-dark-700 rounded text-center text-xs text-gray-500 italic">
                              Break
                            </div>
                          ) : slot?.subject ? (
                            <div 
                              className="p-3 rounded-lg border-l-4"
                              style={{
                                backgroundColor: (slot.subject.color || '#3B82F6') + '20',
                                borderLeftColor: slot.subject.color || '#3B82F6'
                              }}
                            >
                              <div className="text-xs font-semibold" style={{ color: slot.subject.color || '#3B82F6' }}>
                                {slot.subject.code}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {slot.subject.name}
                              </div>
                              {slot.academicUnit && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {slot.academicUnit.parent?.name ? `${slot.academicUnit.parent.name} - ` : ''}{slot.academicUnit.name}
                                </div>
                              )}
                              {slot.room && (
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {slot.room}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 dark:bg-dark-700/30 rounded text-center text-xs text-gray-400">
                              Free
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
