'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertCircle,
  TrendingUp,
  UserCheck,
  CalendarDays
} from 'lucide-react'

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY'
  periodNumber: number | null
  subject: { name: string; code: string } | null
  remarks: string | null
}

interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  leaveDays: number
  percentage: string
}

export default function AttendancePage() {
  const { data: session } = useSession()
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/institution/attendance?month=${selectedMonth}`)
        const data = await res.json()
        setAttendances(data.attendances || [])
        setSummary(data.summary || null)
      } catch (error) {
        console.error('Error fetching attendance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [selectedMonth])

  // Generate calendar days for the selected month
  const generateCalendarDays = () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []
    
    // Empty cells for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, status: null })
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const attendance = attendances.find(a => {
        const attDate = new Date(a.date).toISOString().split('T')[0]
        return attDate === dateStr && a.periodNumber === null
      })
      days.push({
        day,
        status: attendance?.status || null,
        remarks: attendance?.remarks,
      })
    }

    return days
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'ABSENT': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'LATE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'HALF_DAY': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'ON_LEAVE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'HOLIDAY': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default: return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    return status === 'PRESENT' ? 'P' :
           status === 'ABSENT' ? 'A' :
           status === 'LATE' ? 'L' :
           status === 'HALF_DAY' ? 'H' :
           status === 'ON_LEAVE' ? 'LV' :
           status === 'HOLIDAY' ? 'HOL' : '-'
  }

  const calendarDays = generateCalendarDays()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your daily presence and attendance trends</p>
        </div>
        
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Attendance Rate"
            value={`${summary.percentage}%`}
            change={`${summary.presentDays}/${summary.totalDays} days`}
            trend={parseFloat(summary.percentage) >= 75 ? 'up' : 'down'}
            icon={TrendingUp}
            color="bg-primary/20 text-primary-700 dark:text-primary-400"
          />
          <StatCard
            title="Present Days"
            value={summary.presentDays.toString()}
            change="Days present"
            trend="up"
            icon={CheckCircle2}
            color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Absent Days"
            value={summary.absentDays.toString()}
            change="Days missed"
            trend="down"
            icon={XCircle}
            color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
          />
          <StatCard
            title="Late/Half Days"
            value={(summary.lateDays).toString()}
            change="Requires attention"
            trend="down"
            icon={Clock}
            color="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary-700" />
              Calendar View
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-3">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-2xl text-sm transition-all duration-200
                        ${day.day ? 'border border-gray-100 dark:border-dark-700 hover:shadow-soft group cursor-default' : 'bg-transparent'}
                        ${day.day ? getStatusColor(day.status) : ''}
                      `}
                      title={day.remarks || ''}
                    >
                      {day.day && (
                        <>
                          <span className="font-bold group-hover:scale-110 transition-transform">{day.day}</span>
                          {day.status && (
                            <span className="text-[10px] font-bold mt-1 opacity-80">{getStatusLabel(day.status)}</span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-dark-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">On Leave</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Holiday</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attendance Insights */}
        <div className="space-y-6">
          <Card className="border-none shadow-soft overflow-hidden" padding="lg">
            <CardHeader className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary-700" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary && parseFloat(summary.percentage) < 75 ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-800 dark:text-red-300">Shortage Alert</h4>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 leading-relaxed">
                        Your attendance is currently <strong>{summary.percentage}%</strong>, which is below the minimum required 75%.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-green-800 dark:text-green-300">Great Job!</h4>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 leading-relaxed">
                        Your attendance is healthy at <strong>{summary?.percentage}%</strong>. Keep maintaining this consistency!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
                  <span className="text-xs font-bold text-gray-500 uppercase">Working Days</span>
                  <span className="font-bold text-gray-900 dark:text-white">{summary?.totalDays}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
                  <span className="text-xs font-bold text-gray-500 uppercase">Presence Rate</span>
                  <Badge variant={summary && parseFloat(summary.percentage) >= 75 ? 'success' : 'danger'}>
                    {summary?.percentage}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
