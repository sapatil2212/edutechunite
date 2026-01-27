'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  UserCheck,
  ChevronRight,
  Clock,
  ClipboardList,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface ClassInfo {
  id: string
  name: string
  type: string
  studentCount: number
  isPrimary?: boolean
  subjects?: { id: string; name: string; code: string; color: string | null }[]
  role: 'CLASS_TEACHER' | 'SUBJECT_TEACHER'
}

export default function TeacherMyClassesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [classTeacherClasses, setClassTeacherClasses] = useState<ClassInfo[]>([])
  const [subjectTeacherClasses, setSubjectTeacherClasses] = useState<ClassInfo[]>([])
  const [academicYear, setAcademicYear] = useState('')

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
        setAcademicYear(data.data.academicYear || '')
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

  const hasNoClasses = classTeacherClasses.length === 0 && subjectTeacherClasses.length === 0

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Classes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage your assigned classes for {academicYear || 'the current academic year'}
        </p>
      </div>

      {hasNoClasses ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Classes Assigned
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You haven't been assigned any classes yet. Please contact the administration.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Class Teacher Section */}
          {classTeacherClasses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-primary-700 dark:text-primary-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Class Teacher
                </h2>
                <Badge variant="primary">{classTeacherClasses.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classTeacherClasses.map((cls) => (
                  <ClassCard key={cls.id} classInfo={cls} />
                ))}
              </div>
            </div>
          )}

          {/* Subject Teacher Section */}
          {subjectTeacherClasses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Subject Teacher
                </h2>
                <Badge variant="secondary">{subjectTeacherClasses.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subjectTeacherClasses.map((cls) => (
                  <ClassCard key={cls.id} classInfo={cls} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function ClassCard({ classInfo }: { classInfo: ClassInfo }) {
  return (
    <Card className="group hover:shadow-soft-lg transition-all duration-300 border-none shadow-soft overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
                classInfo.role === 'CLASS_TEACHER' 
                  ? 'bg-primary/20' 
                  : 'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                {classInfo.role === 'CLASS_TEACHER' ? (
                  <UserCheck className="w-7 h-7 text-primary-700 dark:text-primary-400" />
                ) : (
                  <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-700 transition-colors">
                  {classInfo.name}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {classInfo.type.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            {classInfo.isPrimary !== undefined && (
              <Badge variant={classInfo.isPrimary ? 'success' : 'info'}>
                {classInfo.isPrimary ? 'Primary' : 'Co-Teacher'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-dark-800 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 text-primary-700" />
              <span>{classInfo.studentCount} Students</span>
            </div>
          </div>

          {/* Subjects taught */}
          {classInfo.subjects && classInfo.subjects.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">
                Assigned Subjects
              </p>
              <div className="flex flex-wrap gap-2">
                {classInfo.subjects.map((subj) => (
                  <span
                    key={subj.id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
                  >
                    {subj.color ? (
                      <span 
                        className="w-2 h-2 rounded-full ring-2 ring-white dark:ring-dark-800" 
                        style={{ backgroundColor: subj.color }}
                      />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-primary ring-2 ring-white dark:ring-dark-800" />
                    )}
                    {subj.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-dark-800 border-t border-gray-100 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/50">
          <Link
            href={`/teacher/classes/${classInfo.id}/students`}
            className="flex flex-col items-center gap-1.5 py-4 hover:bg-white dark:hover:bg-dark-800 transition-all group/action"
          >
            <Users className="w-5 h-5 text-gray-400 group-hover/action:text-primary-700 transition-colors" />
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Students</span>
          </Link>
          <Link
            href={`/teacher/classes/${classInfo.id}/attendance`}
            className="flex flex-col items-center gap-1.5 py-4 hover:bg-white dark:hover:bg-dark-800 transition-all group/action"
          >
            <ClipboardList className="w-5 h-5 text-gray-400 group-hover/action:text-blue-500 transition-colors" />
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Attendance</span>
          </Link>
          <Link
            href={`/teacher/classes/${classInfo.id}`}
            className="flex flex-col items-center gap-1.5 py-4 hover:bg-white dark:hover:bg-dark-800 transition-all group/action"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover/action:text-pink-500 transition-colors" />
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Details</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
