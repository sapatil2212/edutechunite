'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Loader2,
  Printer,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export default function StudentTimetablePage() {
  const [loading, setLoading] = useState(true)
  const [scheduleData, setScheduleData] = useState<any>(null)
  const [activeDay, setActiveDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase())

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/institution/timetable/my-schedule?weekly=true')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const periods = (scheduleData?.periodTimings || [])
    .sort((a: any, b: any) => a.periodNumber - b.periodNumber)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Timetable</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your class schedule and period timings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl border-gray-200 dark:border-dark-700 h-10">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button className="bg-primary hover:bg-primary-600 text-white border-none rounded-xl h-10 font-bold shadow-soft">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Mobile Day Selector */}
      <div className="flex lg:hidden bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-x-auto no-scrollbar">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`
              px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap
              ${activeDay === day 
                ? 'bg-white dark:bg-dark-700 text-primary-700 dark:text-primary-400 shadow-soft' 
                : 'text-gray-500 dark:text-gray-400'}
            `}
          >
            {day.charAt(0) + day.slice(1, 3)}
          </button>
        ))}
      </div>

      <Card className="border-none shadow-soft overflow-hidden bg-white dark:bg-dark-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* Desktop View */}
            <table className="w-full border-collapse hidden lg:table">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-900/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-r border-gray-100 dark:border-dark-700 w-40">
                    Period
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-dark-700 min-w-[180px] ${activeDay === day ? 'text-primary-600 bg-primary-50/30 dark:bg-primary-900/10' : 'text-gray-400'}`}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                {periods.map((timing: any) => (
                  <tr key={timing.periodNumber} className="group">
                    <td className="px-6 py-6 border-r border-gray-100 dark:border-dark-700 bg-gray-50/30 dark:bg-dark-900/10">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-gray-900 dark:text-white">#{timing.periodNumber}</span>
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{timing.startTime} - {timing.endTime}</span>
                        {timing.isBreak && <Badge variant="secondary" className="mt-1 w-fit text-[10px]">Break</Badge>}
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const slot = scheduleData?.schedule?.[day]?.find((s: any) => s.periodNumber === timing.periodNumber)
                      return (
                        <td key={`${day}-${timing.periodNumber}`} className={`p-2 border-r border-gray-100 dark:border-dark-700 last:border-r-0 ${activeDay === day ? 'bg-primary-50/10 dark:bg-primary-900/5' : ''}`}>
                          {slot ? (
                            <div className={`
                              h-full p-4 rounded-2xl border-l-4 shadow-sm transition-all group-hover:shadow-md
                              ${slot.subject?.color ? `border-l-[${slot.subject.color}]` : 'border-l-primary-500'}
                              bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800
                            `}>
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant={slot.slotType === 'BREAK' ? 'secondary' : 'info'} className="text-[10px] font-bold">
                                  {slot.subject?.code || 'BREAK'}
                                </Badge>
                                {slot.room && (
                                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {slot.room}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">
                                {slot.subject?.name || 'Break'}
                              </h4>
                              {slot.teacher && (
                                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {slot.teacher.fullName}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="h-full min-h-[100px] rounded-2xl border-2 border-dashed border-gray-50 dark:border-dark-900/50 flex items-center justify-center group-hover:border-gray-100 transition-colors">
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

            {/* Mobile List View (Today's day selected by default) */}
            <div className="lg:hidden p-4 space-y-4">
              {periods.map((timing: any) => {
                const slot = scheduleData?.schedule?.[activeDay]?.find((s: any) => s.periodNumber === timing.periodNumber)
                return (
                  <div key={timing.periodNumber} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-dark-900/50 rounded-2xl border border-gray-100 dark:border-dark-800">
                    <div className="w-16 shrink-0">
                      <span className="block text-lg font-black text-gray-900 dark:text-white leading-none">#{timing.periodNumber}</span>
                      <span className="block text-[10px] font-bold text-primary-600 mt-1">{timing.startTime}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {slot ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-gray-900 dark:text-white truncate">{slot.subject?.name || 'Break'}</h4>
                            <Badge variant={slot.slotType === 'BREAK' ? 'secondary' : 'info'}>{slot.subject?.code || 'BREAK'}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                             {slot.teacher && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {slot.teacher.fullName}</span>}
                             {slot.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {slot.room}</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="h-10 flex items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Free Period</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20">
        <Info className="w-5 h-5 text-primary-600 flex-shrink-0" />
        <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed font-medium">
          <strong>Tip:</strong> You can print your timetable or export it as a PDF for offline access. The room numbers and teacher names are listed within each period slot.
        </p>
      </div>
    </div>
  )
}
