'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  Clock, 
  Calendar,
  FileText,
  CheckCircle2,
  BarChart3,
  Bell,
  ClipboardList,
  UserCheck,
  ChevronRight,
} from 'lucide-react'

interface ScheduleSlot {
  id: string
  dayOfWeek: string
  period: number
  startTime: string
  endTime: string
  subject?: { name: string; code: string }
  academicUnit?: { name: string }
}

interface ClassInfo {
  id: string
  name: string
  type: string
  studentCount: number
  isPrimary?: boolean
  subjects?: { id: string; name: string; code: string; color: string | null }[]
  role: 'CLASS_TEACHER' | 'SUBJECT_TEACHER'
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [todayClasses, setTodayClasses] = useState<ScheduleSlot[]>([])
  const [classTeacherClasses, setClassTeacherClasses] = useState<ClassInfo[]>([])
  const [subjectTeacherClasses, setSubjectTeacherClasses] = useState<ClassInfo[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch schedule and classes in parallel
        const [scheduleRes, classesRes] = await Promise.all([
          fetch('/api/institution/timetable/my-schedule'),
          fetch('/api/institution/teachers/my-classes'),
        ])

        const scheduleData = await scheduleRes.json()
        const classesData = await classesRes.json()
        
        if (scheduleData.success) {
          setScheduleSlots(scheduleData.data || [])
          
          // Filter for today's classes
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
          const todaySchedule = (scheduleData.data || [])
            .filter((slot: ScheduleSlot) => slot.dayOfWeek === today)
            .sort((a: ScheduleSlot, b: ScheduleSlot) => a.period - b.period)
          setTodayClasses(todaySchedule)
        }

        if (classesData.success) {
          setClassTeacherClasses(classesData.data.classTeacherClasses || [])
          setSubjectTeacherClasses(classesData.data.subjectTeacherClasses || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate stats (ensure arrays before mapping)
  const slotsArray = Array.isArray(scheduleSlots) ? scheduleSlots : []
  const todayArray = Array.isArray(todayClasses) ? todayClasses : []
  const totalPeriods = slotsArray.length
  
  // Calculate total students from assigned classes
  const allClasses = [...classTeacherClasses, ...subjectTeacherClasses]
  const uniqueClassIds = new Set(allClasses.map(c => c.id))
  const assignedClassesCount = uniqueClassIds.size
  const totalStudents = allClasses.reduce((sum, cls) => {
    if (uniqueClassIds.has(cls.id)) {
      uniqueClassIds.delete(cls.id) // Only count once
      return sum + cls.studentCount
    }
    return sum
  }, 0)

  const stats = [
    {
      title: 'Classes Today',
      value: todayArray.length.toString(),
      change: 'Today',
      trend: 'up' as const,
      icon: Calendar,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'My Students',
      value: totalStudents.toString(),
      change: 'Total',
      trend: 'up' as const,
      icon: Users,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Weekly Periods',
      value: totalPeriods.toString(),
      change: 'This week',
      trend: 'up' as const,
      icon: Clock,
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Assigned Classes',
      value: assignedClassesCount.toString(),
      change: 'Total',
      trend: 'up' as const,
      icon: BookOpen,
      color: 'bg-primary/20 text-primary-700 dark:text-primary-400',
    },
  ]

  const recentActivities = [
    {
      id: 1,
      title: 'Assignment Submitted',
      description: '5 students submitted Mathematics Assignment',
      time: '10 minutes ago',
      type: 'assignment',
    },
    {
      id: 2,
      title: 'Attendance Marked',
      description: 'Class 10A attendance marked for today',
      time: '1 hour ago',
      type: 'attendance',
    },
    {
      id: 3,
      title: 'Grade Updated',
      description: 'Physics mid-term grades updated',
      time: '2 hours ago',
      type: 'grade',
    },
    {
      id: 4,
      title: 'New Notice',
      description: 'Staff meeting scheduled for Friday',
      time: '3 hours ago',
      type: 'notice',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Teacher'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your classes today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:shadow-soft transition-all duration-300 group"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                      activity.type === 'assignment' ? 'bg-primary/20 text-primary-700' :
                      activity.type === 'attendance' ? 'bg-blue-50 text-blue-600' :
                      activity.type === 'grade' ? 'bg-purple-50 text-purple-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {activity.type === 'assignment' && <FileText className="w-6 h-6" />}
                      {activity.type === 'attendance' && <UserCheck className="w-6 h-6" />}
                      {activity.type === 'grade' && <ClipboardList className="w-6 h-6" />}
                      {activity.type === 'notice' && <Bell className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-700 transition-colors">
                          {activity.title}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{activity.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle className="text-lg font-bold">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayArray.length > 0 ? (
                todayArray.slice(0, 4).map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-700 transition-colors">
                          {slot.subject?.name || 'Class'}
                        </h4>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{slot.academicUnit?.name}</p>
                      </div>
                      <Badge variant="info" className="font-bold">{slot.startTime}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>Period {slot.period}</span>
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No classes scheduled for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* My Assigned Classes */}
        <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle>My Assigned Classes</CardTitle>
            <Link 
              href="/teacher/classes"
              className="text-sm font-semibold text-primary-700 hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {classTeacherClasses.length === 0 && subjectTeacherClasses.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No classes assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Class Teacher Classes */}
                {classTeacherClasses.slice(0, 2).map((cls) => (
                  <Link
                    key={`ct-${cls.id}`}
                    href={`/teacher/classes/${cls.id}/students`}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-primary-700 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{cls.name}</h4>
                        <Badge variant="primary">Class Teacher</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cls.studentCount} students
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}

                {/* Subject Teacher Classes */}
                {subjectTeacherClasses.slice(0, 2).map((cls) => (
                  <Link
                    key={`st-${cls.id}`}
                    href={`/teacher/classes/${cls.id}/students`}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{cls.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {cls.subjects?.slice(0, 3)?.map((subj) => (
                          <span
                            key={subj.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-dark-900 rounded text-xs"
                          >
                            {subj.color && (
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subj.color }} />
                            )}
                            {subj.name}
                          </span>
                        ))}
                        {cls.subjects && cls.subjects.length > 3 && (
                          <span className="text-xs text-gray-500">+{cls.subjects.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card className="border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle>Class Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Attendance Rate
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">94%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-700 rounded-full shadow-[0_0_10px_rgba(229,243,60,0.3)]" style={{ width: '94%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Assignment Submission
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">87%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: '87%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Average Score
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">78%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]" style={{ width: '78%' }} />
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <Link 
                href="/teacher/reports"
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                View Detailed Reports <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-1 gap-6">
        <Card className="border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link 
                href="/teacher/classes"
                className="p-4 bg-primary/10 hover:bg-primary/20 rounded-2xl text-left transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-primary-700" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  My Classes
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Manage students</p>
              </Link>
              <Link 
                href={classTeacherClasses.length > 0 ? `/teacher/classes/${classTeacherClasses[0].id}/attendance` : '/teacher/classes'}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl text-left transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  Mark Attendance
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Daily roll call</p>
              </Link>
              <Link 
                href="/teacher/assignments?action=new"
                className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-2xl text-left transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  New Assignment
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Create tasks</p>
              </Link>
              <Link 
                href="/teacher/attendance/report"
                className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-2xl text-left transition-all duration-200 group border border-green-100 dark:border-green-900/20"
              >
                <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  View Reports
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Analytics & Trends</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
