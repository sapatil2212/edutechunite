'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  ClipboardList,
  UserCheck,
  BookOpen,
  ChevronRight,
  Loader2,
} from 'lucide-react'

interface ClassInfo {
  id: string
  name: string
  type: string
  studentCount: number
  isPrimary?: boolean
  subjects?: { id: string; name: string; code: string; color: string | null }[]
  role: 'CLASS_TEACHER' | 'SUBJECT_TEACHER'
}

export default function TeacherAttendancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [classTeacherClasses, setClassTeacherClasses] = useState<ClassInfo[]>([])
  const [subjectTeacherClasses, setSubjectTeacherClasses] = useState<ClassInfo[]>([])

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/institution/teachers/my-classes')
      const data = await res.json()
      
      if (data.success) {
        setClassTeacherClasses(data.data.classTeacherClasses || [])
        setSubjectTeacherClasses(data.data.subjectTeacherClasses || [])
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  const allClasses = [...classTeacherClasses, ...subjectTeacherClasses]

  // Remove duplicates based on class id
  const uniqueClasses = Array.from(
    new Map(allClasses.map(cls => [cls.id, cls])).values()
  )

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mark Attendance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select a class to mark attendance
        </p>
      </div>

      {uniqueClasses.length === 0 ? (
        <Card className="border-none shadow-soft">
          <CardContent className="py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Classes Assigned
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              You haven't been assigned any classes yet. Please contact the administration to set up your teaching schedule.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {uniqueClasses.map((cls) => (
            <Link 
              key={cls.id}
              href={`/teacher/classes/${cls.id}/attendance`}
              className="group"
            >
              <Card className="hover:shadow-soft-lg transition-all duration-300 border-none shadow-soft h-full overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
                      cls.role === 'CLASS_TEACHER' 
                        ? 'bg-primary/20' 
                        : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      {cls.role === 'CLASS_TEACHER' ? (
                        <UserCheck className="w-7 h-7 text-primary-700 dark:text-primary-400" />
                      ) : (
                        <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-700 transition-colors">
                          {cls.name}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-700 transition-colors transform group-hover:translate-x-1" />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="info">
                          <Users className="w-3 h-3 mr-1" />
                          {cls.studentCount} students
                        </Badge>
                        {cls.role === 'CLASS_TEACHER' && (
                          <Badge variant="success">Class Teacher</Badge>
                        )}
                      </div>
                      
                      {/* Subjects taught in this class */}
                      {cls.subjects && cls.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50 dark:border-dark-800">
                          {cls.subjects.slice(0, 3).map((subj) => (
                            <span
                              key={subj.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-tight"
                            >
                              {subj.color && (
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subj.color }} />
                              )}
                              {subj.name}
                            </span>
                          ))}
                          {cls.subjects.length > 3 && (
                            <span className="text-[10px] font-bold text-gray-400 self-center">+{cls.subjects.length - 3} MORE</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
