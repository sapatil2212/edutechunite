'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, 
  Search, 
  Loader2,
  ChevronRight,
  Filter,
  Download,
  Users,
  BookOpen,
  Trophy,
  BarChart2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function TeacherGradesPage() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Simulate loading
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
            Student Grades
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor student academic performance and grading history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-xl border border-gray-100 dark:border-dark-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold h-11">
            <BarChart2 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase">Top Performer</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Alex Johnson (98%)</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase">Class Average</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">76.4%</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase">Total Graded</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">142 Students</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-soft bg-white dark:bg-dark-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-50 dark:border-dark-700 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                className="pl-9 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="h-11 px-4 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm font-medium focus:outline-none">
              <option>All Classes</option>
              <option>Class 10 - A</option>
              <option>Class 10 - B</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-900/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assignments</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Exams</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Final Grade</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                {[
                  { name: 'Alex Johnson', class: '10-A', assignments: '92%', exams: '95%', final: '94%', color: 'text-green-600' },
                  { name: 'Sarah Miller', class: '10-A', assignments: '88%', exams: '82%', final: '85%', color: 'text-blue-600' },
                  { name: 'Michael Chen', class: '10-B', assignments: '75%', exams: '78%', final: '77%', color: 'text-primary-700' },
                  { name: 'Emma Davis', class: '10-A', assignments: '62%', exams: '65%', final: '64%', color: 'text-amber-600' },
                  { name: 'James Wilson', class: '10-B', assignments: '45%', exams: '52%', final: '49%', color: 'text-red-600' },
                ].map((student, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary-700 font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.class}</td>
                    <td className="px-6 py-4 text-sm font-medium">{student.assignments}</td>
                    <td className="px-6 py-4 text-sm font-medium">{student.exams}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-black ${student.color}`}>{student.final}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary-700 rounded-lg">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
