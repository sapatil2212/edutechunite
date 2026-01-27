'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  FileBarChart,
  Download,
  Filter,
  Loader2,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/dashboard/stat-card'

export default function TeacherReportsPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => setLoading(false), 1000)
  }, [])

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
            Academic Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze class performance and student progress across subjects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-xl border border-gray-100 dark:border-dark-700">
            <Filter className="w-4 h-4 mr-2" />
            Filter Data
          </Button>
          <Button className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold h-11">
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg. Class Performance"
          value="78.5%"
          change="+4.2%"
          trend="up"
          icon={TrendingUp}
          color="bg-green-500/10 text-green-600"
        />
        <StatCard
          title="Attendance Rate"
          value="92.4%"
          change="-1.5%"
          trend="down"
          icon={Users}
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Assignments Done"
          value="856"
          change="+120"
          trend="up"
          icon={FileBarChart}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Upcoming Exams"
          value="4"
          change="0"
          trend="up"
          icon={Calendar}
          color="bg-primary/20 text-primary-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Subject */}
        <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-700" />
              Subject Performance
            </h3>
            <div className="space-y-6">
              {[
                { name: 'Mathematics', score: 82, color: 'bg-blue-500' },
                { name: 'Physics', score: 75, color: 'bg-purple-500' },
                { name: 'Chemistry', score: 68, color: 'bg-green-500' },
                { name: 'English', score: 88, color: 'bg-amber-500' },
              ].map((subj) => (
                <div key={subj.name} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-700 dark:text-gray-300">{subj.name}</span>
                    <span className="text-primary-700">{subj.score}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-dark-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`${subj.color} h-full rounded-full transition-all duration-1000`} 
                      style={{ width: `${subj.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Reports */}
        <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileBarChart className="w-5 h-5 text-primary-700" />
              Available Report Templates
            </h3>
            <div className="space-y-3">
              {[
                'Monthly Attendance Summary',
                'Subject-wise Grade Distribution',
                'Student Performance Ranking',
                'Assignment Completion Report',
                'Mid-Term Exam Analytics'
              ].map((report) => (
                <button 
                  key={report}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700 hover:border-primary hover:bg-white dark:hover:bg-dark-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-700">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-700">{report}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-700" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
