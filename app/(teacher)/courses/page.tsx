'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Loader2, AlertCircle, Users, Layers } from 'lucide-react'

interface Course {
  id: string
  name: string
  code: string | null
  description: string | null
  type: 'ACADEMIC' | 'CERTIFICATION' | 'TRAINING' | 'COACHING'
  _count: {
    academicUnits: number
    students: number
  }
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/institution/courses?status=ACTIVE')
      const result = await response.json()
      if (result.success) {
        setCourses(result.data)
      } else {
        setError(result.message || 'Failed to fetch courses')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch courses')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const getTypeColor = (type: Course['type']) => {
    switch (type) {
      case 'ACADEMIC':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
      case 'CERTIFICATION':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
      case 'TRAINING':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
      case 'COACHING':
        return 'bg-primary/10 text-primary-700 dark:text-primary-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Available Courses
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore all academic and professional courses offered by the institution
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary-700" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-2">Error Loading Courses</h3>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent text-center">
          <CardContent className="py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-primary-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Courses Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
              There are currently no active courses listed in the institution's curriculum.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white dark:bg-dark-800 rounded-2xl border-none shadow-soft overflow-hidden hover:shadow-soft-lg transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${getTypeColor(course.type)}`}>
                        {course.type}
                      </span>
                      {course.code && (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full uppercase">
                          {course.code}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-700 transition-colors">
                      {course.name}
                    </h3>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 font-medium leading-relaxed">
                  {course.description || 'Comprehensive curriculum covering all key learning objectives and academic milestones for this course level.'}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-900/50 rounded-xl group/stat">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover/stat:scale-110 transition-transform">
                      <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Units</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{course._count.academicUnits}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-900/50 rounded-xl group/stat">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover/stat:scale-110 transition-transform">
                      <Users className="w-5 h-5 text-primary-700" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Students</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{course._count.students}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  )
}
