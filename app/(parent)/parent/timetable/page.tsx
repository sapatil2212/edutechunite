'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  Calendar as CalendarIcon, 
  MapPin, 
  User,
  ChevronLeft,
  ChevronRight,
  Printer
} from 'lucide-react'

interface Child {
  id: string
  fullName: string
}

interface TimetableSlot {
  id: string
  startTime: string
  endTime: string
  dayOfWeek: string
  subject: { name: string; code: string }
  teacher: { fullName: string }
  room: string | null
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export default function ParentTimetablePage() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<Record<string, TimetableSlot[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() - 1] || 'MONDAY')

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
      fetchTimetable()
    }
  }, [selectedChild])

  const fetchTimetable = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/institution/timetable/my-schedule?studentId=${selectedChild}&weekly=true`)
      const data = await res.json()
      setSchedule(data.data?.schedule || {})
    } catch (error) {
      console.error('Error fetching timetable:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Class Schedule</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Weekly academic timetable for your child</p>
        </div>

        <div className="flex items-center gap-4">
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
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-dark-700 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-dark-700 transition-all shadow-sm">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {!selectedChild ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* Day Selector (Mobile & Desktop) */}
          <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700 w-full overflow-x-auto no-scrollbar">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`
                  flex-1 min-w-[100px] px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                  ${activeDay === day 
                    ? 'bg-white dark:bg-dark-700 text-green-700 dark:text-green-400 shadow-soft' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-green-600" />
                  {activeDay.charAt(0) + activeDay.slice(1).toLowerCase()}'s Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : !schedule[activeDay] || schedule[activeDay].length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Classes Scheduled</h3>
                    <p>There are no classes scheduled for this day.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedule[activeDay].sort((a, b) => a.startTime.localeCompare(b.startTime)).map((slot) => (
                      <div 
                        key={slot.id} 
                        className="group flex flex-col md:flex-row md:items-center gap-6 p-5 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:shadow-soft hover:border-green-100 dark:hover:border-green-900/20 transition-all duration-300"
                      >
                        <div className="flex flex-col justify-center min-w-[120px] p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                          <span className="text-sm font-black text-green-700 dark:text-green-400">{slot.startTime}</span>
                          <span className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest mt-1">To</span>
                          <span className="text-sm font-black text-green-700 dark:text-green-400 mt-1">{slot.endTime}</span>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="success" className="bg-green-100 text-green-700 dark:bg-green-900/30 font-black px-2 py-0.5 text-[10px] uppercase tracking-wider">
                              {slot.subject.code}
                            </Badge>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-700 transition-colors">
                              {slot.subject.name}
                            </h4>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                              <User className="w-4 h-4 text-gray-400" />
                              {slot.teacher.fullName}
                            </div>
                            {slot.room && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                Room {slot.room}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="hidden md:block">
                          <div className="w-12 h-12 bg-gray-50 dark:bg-dark-900/50 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-green-500 transition-colors">
                            <Clock className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
