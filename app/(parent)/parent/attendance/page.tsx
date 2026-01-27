'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  Users,
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Child {
  id: string
  fullName: string
  academicUnit: { name: string }
}

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE' | 'HOLIDAY'
  remarks: string | null
}

export default function ParentAttendancePage() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch('/api/institution/parent/children')
        const result = await res.json()
        if (result.children?.length > 0) {
          setChildren(result.children)
          setSelectedChild(result.children[0].id)
        }
      } catch (error) {
        console.error('Error fetching children:', error)
      }
    }
    fetchChildren()
  }, [])

  useEffect(() => {
    if (selectedChild) {
      fetchAttendance()
    }
  }, [selectedChild, currentDate])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      const res = await fetch(`/api/institution/attendance?studentId=${selectedChild}&month=${month}&year=${year}`)
      const data = await res.json()
      setRecords(data.attendances || [])
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case 'ABSENT': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      case 'LATE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'ON_LEAVE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'HOLIDAY': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Tracking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor your child's daily presence and punctuality</p>
        </div>

        {children.length > 1 && (
          <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  selectedChild === child.id
                    ? 'bg-white dark:bg-dark-700 text-green-700 dark:text-green-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {child.fullName.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedChild ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Attendance Rate"
              value={`${summary?.percentage || '0'}%`}
              change={`${summary?.presentDays || 0} days present`}
              trend="up"
              icon={CheckCircle2}
              color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Total Absences"
              value={(summary?.absentDays || 0).toString()}
              change="This semester"
              trend="down"
              icon={XCircle}
              color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            />
            <StatCard
              title="Late Arrivals"
              value={(summary?.lateDays || 0).toString()}
              change="Requires attention"
              trend="down"
              icon={Clock}
              color="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
            />
            <StatCard
              title="Approved Leave"
              value={(summary?.leaveDays || 0).toString()}
              change="Medical/Personal"
              trend="up"
              icon={CalendarIcon}
              color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-50 dark:border-dark-800 flex flex-row items-center justify-between p-6">
                <CardTitle className="text-lg font-bold">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl"
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-7 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-24" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const record = records.find(r => r.date.startsWith(dateStr))
                    return (
                      <div 
                        key={day} 
                        className={`h-24 rounded-2xl border p-2 flex flex-col justify-between transition-all hover:shadow-soft ${
                          record ? getStatusColor(record.status) : 'bg-gray-50/50 dark:bg-dark-900/30 border-transparent'
                        }`}
                      >
                        <span className="text-sm font-bold">{day}</span>
                        {record && (
                          <div className="text-[10px] font-bold uppercase tracking-tighter truncate">
                            {record.status}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Legend & Recent Records */}
            <div className="space-y-6">
              <Card className="border-none shadow-soft" padding="lg">
                <CardHeader className="border-b border-gray-50 dark:border-dark-800 pb-4 mb-4">
                  <CardTitle className="text-sm font-bold uppercase text-gray-500">Attendance Legend</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Present</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">Absent</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium">Late Arrival</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">On Leave</span>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-soft overflow-hidden">
                <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Recent Concerns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {records.filter(r => r.status === 'ABSENT' || r.status === 'LATE').slice(0, 3).map((record, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-bold text-red-700 dark:text-red-400">
                            {record.status === 'ABSENT' ? 'Missed Class' : 'Arrived Late'}
                          </span>
                          <span className="text-[10px] font-bold text-red-400">
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-300">
                          {record.remarks || 'No reason provided by teacher.'}
                        </p>
                      </div>
                    ))}
                    {records.filter(r => r.status === 'ABSENT' || r.status === 'LATE').length === 0 && (
                      <div className="text-center py-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No attendance concerns recently!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
