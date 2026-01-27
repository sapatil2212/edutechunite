'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Loader2,
  Printer,
  Download,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export default function TeacherTimetablePage() {
  const [loading, setLoading] = useState(true)
  const [scheduleData, setScheduleData] = useState<any>(null)

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

  const periods = Object.entries(scheduleData?.periodTimings || {})
    .sort(([a], [b]) => parseInt(a) - parseInt(b))

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
            Weekly Timetable
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your complete weekly teaching schedule across all classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="rounded-xl border border-gray-100 dark:border-dark-700">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-soft overflow-hidden bg-white dark:bg-dark-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-900/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 dark:border-dark-700 w-40">
                    Period
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-dark-700 min-w-[200px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                {periods.map(([periodNum, timing]: [string, any]) => (
                  <tr key={periodNum} className="group">
                    <td className="px-6 py-8 border-r border-gray-100 dark:border-dark-700 bg-gray-50/30 dark:bg-dark-900/10">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-gray-900 dark:text-white">#{periodNum}</span>
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400">{timing.startTime} - {timing.endTime}</span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase mt-1">{timing.name}</span>
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const slot = scheduleData?.schedule?.[day]?.find((s: any) => s.periodNumber === parseInt(periodNum))
                      return (
                        <td key={`${day}-${periodNum}`} className="p-2 border-r border-gray-100 dark:border-dark-700 last:border-r-0">
                          {slot ? (
                            <div className={`
                              h-full p-4 rounded-2xl border-l-4 shadow-sm transition-all group-hover:shadow-md
                              ${slot.subject?.color ? `border-[${slot.subject.color}]` : 'border-primary'}
                              bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800
                            `}>
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="primary" className="text-[10px] font-bold">
                                  {slot.subject?.code}
                                </Badge>
                                <span className="text-[10px] font-bold text-gray-400">Rm: {slot.room || 'N/A'}</span>
                              </div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">
                                {slot.subject?.name}
                              </h4>
                              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                                {slot.academicUnit?.parent?.name} - {slot.academicUnit?.name}
                              </p>
                            </div>
                          ) : (
                            <div className="h-full min-h-[100px] rounded-2xl border-2 border-dashed border-gray-50 dark:border-dark-900 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">Free</span>
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
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> This timetable shows only your assigned teaching periods. School-wide breaks and events may not be listed here.
        </p>
      </div>
    </div>
  )
}
