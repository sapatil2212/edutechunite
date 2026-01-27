'use client'

import { useEffect, useState } from 'react'
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
  Trophy,
  BarChart3,
  Bell,
  ClipboardList,
  ChevronRight,
  GraduationCap,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'

interface DashboardData {
  student: {
    fullName: string
    admissionNumber: string
    academicUnit: { name: string }
    academicYear: { name: string }
  } | null
  attendance: {
    percentage: string
    presentDays: number
    totalDays: number
  }
  todayTimetable: Array<{
    periodNumber: number
    startTime: string
    endTime: string
    subject: { name: string; color: string } | null
    teacher: { fullName: string } | null
    slotType: string
  }>
  pendingHomework: number
  upcomingExams: Array<{
    name: string
    startDate: string
    schedules: Array<{
      subject: { name: string }
      examDate: string
    }>
  }>
  recentNotices: Array<{
    id: string
    title: string
    noticeType: string
    publishedAt: string
    priority: string
  }>
  recentResults: Array<{
    exam: { name: string }
    overallPercentage: string
    subjects: Array<{
      subject: { name: string }
      marksObtained: number
      maxMarks: number
      grade: string
    }>
  }>
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all dashboard data in parallel
        const [
          studentRes,
          attendanceRes,
          timetableRes,
          homeworkRes,
          examsRes,
          noticesRes,
          resultsRes,
        ] = await Promise.all([
          fetch('/api/institution/students/' + session?.user?.studentId),
          fetch('/api/institution/attendance?studentId=' + session?.user?.studentId),
          fetch('/api/institution/timetable/my-schedule'),
          fetch('/api/institution/homework?upcoming=true'),
          fetch('/api/institution/exams?upcoming=true'),
          fetch('/api/institution/notices?limit=5'),
          fetch('/api/institution/results'),
        ])

        const studentData = await studentRes.json()
        const attendanceData = await attendanceRes.json()
        const timetableData = await timetableRes.json()
        const homeworkData = await homeworkRes.json()
        const examsData = await examsRes.json()
        const noticesData = await noticesRes.json()
        const resultsData = await resultsRes.json()

        setData({
          student: studentData.student || null,
          attendance: attendanceData.summary || { percentage: '0', presentDays: 0, totalDays: 0 },
          todayTimetable: timetableData.todaySchedule || [],
          pendingHomework: homeworkData.homeworks?.filter((h: any) => !h.submission || h.submission.status === 'PENDING').length || 0,
          upcomingExams: examsData.exams || [],
          recentNotices: noticesData.notices || [],
          recentResults: resultsData.results || [],
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.studentId) {
      fetchDashboardData()
    }
  }, [session])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Attendance',
      value: `${data?.attendance?.percentage || '0'}%`,
      change: `${data?.attendance?.presentDays}/${data?.attendance?.totalDays} days`,
      trend: 'up' as const,
      icon: CheckCircle2,
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    },
    {
      title: 'Pending Tasks',
      value: (data?.pendingHomework || 0).toString(),
      change: 'Homework',
      trend: 'down' as const,
      icon: FileText,
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Upcoming Exams',
      value: (data?.upcomingExams?.length || 0).toString(),
      change: 'Next 30 days',
      trend: 'up' as const,
      icon: Calendar,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Last Result',
      value: data?.recentResults?.[0]?.overallPercentage ? `${data.recentResults[0].overallPercentage}%` : '-',
      change: 'Academic',
      trend: 'up' as const,
      icon: Trophy,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
  ]

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {data?.student?.academicUnit?.name} • {data?.student?.academicYear?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Today's Timetable */}
        <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle>Today's Timetable</CardTitle>
            <Link 
              href="/student/timetable"
              className="text-sm font-semibold text-primary-700 hover:underline flex items-center gap-1"
            >
              View Full <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {data?.todayTimetable && data.todayTimetable.length > 0 ? (
              <div className="space-y-4">
                {data.todayTimetable.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:shadow-soft transition-all duration-300 group"
                  >
                    <div className="w-20 text-sm font-bold text-gray-400 uppercase tracking-tight">
                      {slot.startTime}
                    </div>
                    <div 
                      className="w-1.5 h-12 rounded-full"
                      style={{ backgroundColor: slot.subject?.color || '#6B7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-700 transition-colors">
                          {slot.slotType === 'BREAK' ? 'Break' : slot.subject?.name || 'Free Period'}
                        </h4>
                        <Badge variant={slot.slotType === 'BREAK' ? 'secondary' : 'info'} className="font-bold">
                          Period {slot.periodNumber}
                        </Badge>
                      </div>
                      {slot.teacher && (
                        <p className="text-xs font-medium text-gray-500 mt-0.5">
                          {slot.teacher.fullName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No classes scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events/Exams */}
        <Card className="border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle>Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.upcomingExams && data.upcomingExams.length > 0 ? (
                data.upcomingExams.slice(0, 3).map((exam, index) => (
                  <div key={index} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 group hover:border-red-300 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-800 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{exam.name}</h4>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-red-600/70 uppercase tracking-wider">
                      <span>Starts</span>
                      <span>{new Date(exam.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No upcoming exams</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Notices */}
        <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle>Recent Notices</CardTitle>
            <Link 
              href="/student/notices"
              className="text-sm font-semibold text-primary-700 hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentNotices && data.recentNotices.length > 0 ? (
                data.recentNotices.map((notice) => (
                  <div key={notice.id} className="flex items-start gap-4 p-4 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:shadow-soft transition-all duration-300 group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                      notice.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                      notice.priority === 'HIGH' ? 'bg-orange-50 text-orange-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      <Bell className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-700 transition-colors">
                          {notice.title}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          {new Date(notice.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{notice.noticeType}</Badge>
                        {notice.priority !== 'NORMAL' && (
                          <Badge variant={notice.priority === 'CRITICAL' ? 'danger' : 'warning'} className="text-[10px]">
                            {notice.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No notices</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-none shadow-soft overflow-hidden" padding="lg">
          <CardHeader className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                href="/student/homework"
                className="p-4 bg-primary/10 hover:bg-primary/20 rounded-2xl text-left transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-primary-700" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Homework</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Assignments</p>
              </Link>
              <Link 
                href="/student/attendance"
                className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl text-left transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Attendance</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Track record</p>
              </Link>
              <Link 
                href="/student/results"
                className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-2xl text-left transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Results</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Exam performance</p>
              </Link>
              <Link 
                href="/student/fees"
                className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-2xl text-left transition-all duration-200 group border border-green-100 dark:border-green-900/20"
              >
                <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Fees</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Billing & Finance</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
