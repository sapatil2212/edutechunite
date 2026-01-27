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
  CreditCard,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

interface Child {
  id: string
  fullName: string
  admissionNumber: string
  academicUnit: { name: string }
  academicYear: { name: string }
  profilePhoto: string | null
}

interface DashboardData {
  attendance: { percentage: string; presentDays: number; totalDays: number }
  pendingHomework: number
  upcomingExams: any[]
  recentNotices: any[]
  feeStatus: { pending: number; paid: number; total: number }
}

export default function ParentDashboard() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch linked children
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

  // Fetch dashboard data for selected child
  useEffect(() => {
    if (!selectedChild) {
      setLoading(false)
      return
    }

    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const [attendanceRes, homeworkRes, examsRes, noticesRes] = await Promise.all([
          fetch(`/api/institution/attendance?studentId=${selectedChild}`),
          fetch(`/api/institution/homework?studentId=${selectedChild}`),
          fetch('/api/institution/exams?upcoming=true'),
          fetch('/api/institution/notices?limit=5'),
        ])

        const [attendanceData, homeworkData, examsData, noticesData] = await Promise.all([
          attendanceRes.json(),
          homeworkRes.json(),
          examsRes.json(),
          noticesRes.json(),
        ])

        setData({
          attendance: attendanceData.summary || { percentage: '0', presentDays: 0, totalDays: 0 },
          pendingHomework: homeworkData.homeworks?.filter((h: any) => !h.submission || h.submission.status === 'PENDING').length || 0,
          upcomingExams: examsData.exams || [],
          recentNotices: noticesData.notices || [],
          feeStatus: { pending: 0, paid: 0, total: 0 },
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [selectedChild])

  const selectedChildData = children.find(c => c.id === selectedChild)

  return (
    <div className="space-y-8">
      {/* Header & Child Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Parent'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedChildData ? (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Viewing: <span className="font-bold text-primary-700 dark:text-primary-400">{selectedChildData.fullName}</span>
                <span className="text-gray-300">|</span>
                {selectedChildData.academicUnit?.name}
              </span>
            ) : (
              "Manage your children's educational progress"
            )}
          </p>
        </div>

        {children.length > 1 && (
          <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  selectedChild === child.id
                    ? 'bg-white dark:bg-dark-700 text-primary-700 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {child.fullName.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : children.length === 0 ? (
        <Card className="border-none shadow-soft text-center py-16" padding="lg">
          <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Children Linked</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Please contact the school administration to link your children to your account so you can track their progress.
          </p>
        </Card>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Attendance"
              value={`${data?.attendance?.percentage || '0'}%`}
              change={`${data?.attendance?.presentDays}/${data?.attendance?.totalDays} days`}
              trend="up"
              icon={CheckCircle2}
              color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Pending Tasks"
              value={(data?.pendingHomework || 0).toString()}
              change="Homework items"
              trend="down"
              icon={FileText}
              color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
            />
            <StatCard
              title="Upcoming Exams"
              value={(data?.upcomingExams?.length || 0).toString()}
              change="Next 30 days"
              trend="up"
              icon={Calendar}
              color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
            />
            <StatCard
              title="Fee Balance"
              value={`$${data?.feeStatus?.pending || 0}`}
              change="Academic Year"
              trend="up"
              icon={CreditCard}
              color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Today's Update & Notices */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Update */}
              <Card className="border-none shadow-soft overflow-hidden" padding="lg">
                <CardHeader className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
                  <CardTitle>Today's Update</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/30 group hover:shadow-soft transition-all duration-300">
                      <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">Attendance Marked</h4>
                        <p className="text-sm text-green-800 dark:text-green-300">
                          {selectedChildData?.fullName} is marked <span className="font-bold underline">Present</span> today.
                        </p>
                      </div>
                      <Badge variant="success" className="font-bold">LIVE</Badge>
                    </div>

                    {data?.pendingHomework && data.pendingHomework > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800/30 group hover:shadow-soft transition-all duration-300">
                        <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm">
                          <FileText className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">Homework Alert</h4>
                          <p className="text-sm text-orange-800 dark:text-orange-300">
                            {data.pendingHomework} pending assignments require attention.
                          </p>
                        </div>
                        <Link href="/parent/homework" className="text-xs font-bold text-orange-600 hover:underline">View All</Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Notices */}
              <Card className="border-none shadow-soft overflow-hidden" padding="lg">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
                  <CardTitle>Recent Notices</CardTitle>
                  <Link href="/parent/notices" className="text-sm font-semibold text-primary-700 hover:underline">
                    View all
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.recentNotices && data.recentNotices.length > 0 ? (
                      data.recentNotices.map((notice: any) => (
                        <div key={notice.id} className="flex items-start gap-4 p-4 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:shadow-soft transition-all duration-300 group">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 bg-blue-50 text-blue-600`}>
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
                            <Badge variant="secondary" className="text-[10px]">{notice.noticeType}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p>No new notices</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card className="border-none shadow-soft overflow-hidden" padding="lg">
                <CardHeader className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-6">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <Link
                      href="/parent/attendance"
                      className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-2xl text-left transition-all duration-200 group flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Attendance</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Daily Presence</p>
                      </div>
                    </Link>
                    <Link
                      href="/parent/results"
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl text-left transition-all duration-200 group flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Trophy className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Results</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Exam Grades</p>
                      </div>
                    </Link>
                    <Link
                      href="/parent/timetable"
                      className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-2xl text-left transition-all duration-200 group flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Timetable</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Class Schedule</p>
                      </div>
                    </Link>
                    <Link
                      href="/parent/fees"
                      className="p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-2xl text-left transition-all duration-200 group flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Fees</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Payments</p>
                      </div>
                    </Link>
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
