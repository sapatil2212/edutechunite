'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, TrendingUp, DollarSign, Clock, CheckCircle2, ChevronRight, Bell, Calendar } from 'lucide-react'

interface DashboardStats {
  totalStudents: {
    value: number
    change: string
    trend: 'up' | 'down'
  }
  activeCourses: {
    value: number
    change: string
    trend: 'up' | 'down'
  }
  monthlyRevenue: {
    value: string
    change: string
    trend: 'up' | 'down'
    rawValue: number
  }
  attendanceRate: {
    value: string
    change: string
    trend: 'up' | 'down'
    rawValue: number
  }
}

interface Activity {
  id: string
  title: string
  description: string
  time: string
  type: 'enrollment' | 'assignment' | 'payment' | 'completion'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch stats and activities in parallel
        const [statsRes, activitiesRes] = await Promise.all([
          fetch('/api/institution/dashboard/stats'),
          fetch('/api/institution/dashboard/activities?limit=4'),
        ])

        if (!statsRes.ok || !activitiesRes.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const statsData = await statsRes.json()
        const activitiesData = await activitiesRes.json()

        setStats(statsData.stats)
        setActivities(activitiesData.activities)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statsArray = stats ? [
    {
      title: 'Total Students',
      value: stats.totalStudents.value.toString(),
      change: stats.totalStudents.change,
      trend: stats.totalStudents.trend,
      icon: Users,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Active Courses',
      value: stats.activeCourses.value.toString(),
      change: stats.activeCourses.change,
      trend: stats.activeCourses.trend,
      icon: BookOpen,
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Monthly Revenue',
      value: stats.monthlyRevenue.value,
      change: stats.monthlyRevenue.change,
      trend: stats.monthlyRevenue.trend,
      icon: DollarSign,
      color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Attendance Rate',
      value: stats.attendanceRate.value,
      change: stats.attendanceRate.change,
      trend: stats.attendanceRate.trend,
      icon: TrendingUp,
      color: 'bg-primary/20 text-primary-700 dark:text-primary-400',
    },
  ] : []

  const upcomingClasses = [
    {
      id: 1,
      subject: 'Mathematics',
      teacher: 'Dr. Smith',
      time: '09:00 AM',
      room: 'Room 101',
      students: 45,
    },
    {
      id: 2,
      subject: 'Physics',
      teacher: 'Prof. Johnson',
      time: '11:00 AM',
      room: 'Lab 203',
      students: 38,
    },
    {
      id: 3,
      subject: 'Chemistry',
      teacher: 'Dr. Williams',
      time: '02:00 PM',
      room: 'Lab 105',
      students: 42,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />
      
      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening with your institution today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="relative overflow-hidden animate-pulse">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700" />
                </Card>
              ))
            ) : error ? (
              <div className="col-span-4 text-center text-red-600 dark:text-red-400 py-8">
                {error}
              </div>
            ) : (
              statsArray.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activities */}
            <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-dark-800 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Recent Activities</CardTitle>
                <Link href="/dashboard/notifications" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse">
                        <div className="h-16" />
                      </div>
                    ))
                  ) : activities.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No recent activities
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:shadow-soft transition-all duration-300 group"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                          activity.type === 'enrollment' ? 'bg-blue-50 text-blue-600' :
                          activity.type === 'assignment' ? 'bg-primary/20 text-primary-700' :
                          activity.type === 'completion' ? 'bg-purple-50 text-purple-600' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {activity.type === 'enrollment' && <Users className="w-6 h-6" />}
                          {activity.type === 'assignment' && <BookOpen className="w-6 h-6" />}
                          {activity.type === 'completion' && <CheckCircle2 className="w-6 h-6" />}
                          {activity.type === 'payment' && <DollarSign className="w-6 h-6" />}
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
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Classes */}
            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-dark-800">
                <CardTitle className="text-lg font-bold">Upcoming Classes</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {upcomingClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="p-4 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:border-primary/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-700 transition-colors">
                            {classItem.subject}
                          </h4>
                          <p className="text-xs font-medium text-gray-500 mt-0.5">{classItem.teacher}</p>
                        </div>
                        <Badge variant="info" className="font-bold">{classItem.time}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <span>{classItem.room}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {classItem.students} Students</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-dark-800">
                <CardTitle className="text-lg font-bold">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Student Satisfaction
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">92%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-700 rounded-full shadow-[0_0_10px_rgba(229,243,60,0.3)]" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Course Completion
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
                        Assignment Submission
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">95%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]" style={{ width: '95%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-dark-800">
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-primary/10 hover:bg-primary/20 rounded-2xl text-left transition-all duration-200 group">
                    <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-primary-700" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      Add Student
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Enroll new pupil</p>
                  </button>
                  <button className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl text-left transition-all duration-200 group">
                    <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      Create Course
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Add to curriculum</p>
                  </button>
                  <button className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-2xl text-left transition-all duration-200 group">
                    <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      Schedule Class
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Manage timetable</p>
                  </button>
                  <button className="p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-2xl text-left transition-all duration-200 group">
                    <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <DollarSign className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      Generate Invoice
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Billing & Finance</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
