'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Loader2,
  ChevronRight,
  BookMarked,
  Info,
  Clock,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Course {
  id: string
  name: string
  code: string | null
  description: string | null
  type: string
  durationValue: number | null
  durationUnit: string | null
  _count: {
    students: number
    subjects: number
    academicUnits: number
  }
  subjects: {
    id: string
    name: string
    code: string
  }[]
}

export default function TeacherCoursesPage() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/institution/teachers/courses')
      const data = await res.json()
      if (data.data) {
        setCourses(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

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
            My Courses
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of academic courses and programs you are involved in
          </p>
        </div>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="border-none shadow-soft overflow-hidden bg-white dark:bg-dark-800 hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <BookMarked className="w-8 h-8 text-primary-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {course.name}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {course.type}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          {course.code || 'No Code'} • {course.durationValue} {course.durationUnit?.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-dark-900 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Students</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{course._count.students}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-dark-900 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Subjects</p>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{course._count.subjects}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-dark-900 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Classes</p>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{course._count.academicUnits}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Your Assigned Subjects</p>
                    <div className="flex flex-wrap gap-2">
                      {course.subjects.map((subject) => (
                        <Badge 
                          key={subject.id} 
                          variant="info" 
                          className="bg-primary/10 text-primary-700 border-none px-3 py-1 text-xs"
                        >
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-dark-700">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      Duration: {course.durationValue} {course.durationUnit}
                    </div>
                    <Link href={`/teacher/subjects?courseId=${course.id}`}>
                      <Button variant="ghost" className="text-primary-700 font-bold hover:bg-primary/10">
                        View Subjects
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-soft py-20 text-center bg-white dark:bg-dark-800">
          <CardContent>
            <div className="w-20 h-20 bg-gray-50 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookMarked className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Courses Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              You are not currently assigned to any courses. Please contact the administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
