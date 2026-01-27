'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  ArrowLeft,
  Search,
  Phone,
  Mail,
  User,
  Calendar,
  Eye,
  Edit,
  Loader2,
} from 'lucide-react'

interface Student {
  id: string
  studentId: string // alias for admissionNumber
  admissionNumber?: string
  rollNumber: string | null
  firstName: string
  lastName: string
  fullName?: string
  email: string | null
  phone: string | null
  profilePhoto: string | null
  gender: string | null
  dateOfBirth: string | null
  status: string
}

interface ClassInfo {
  id: string
  name: string
  type: string
}

export default function ClassStudentsPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params?.classId as string

  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (classId) {
      fetchStudents()
    }
  }, [classId])

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/institution/teachers/my-classes/${classId}/students`)
      const data = await res.json()
      
      if (data.success) {
        setStudents(data.data.students || [])
        setClassInfo(data.data.class)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const name = student.fullName || `${student.firstName} ${student.lastName}`
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId || student.admissionNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <Link 
          href="/teacher/classes"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Classes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {classInfo?.name || 'Class'} Students
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and view profiles for {students.length} students
            </p>
          </div>
          <Link href={`/teacher/classes/${classId}/attendance`}>
            <Button className="shadow-lg shadow-primary/20">
              <Calendar className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-700 transition-colors" />
          <Input
            placeholder="Search by name, ID, or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 bg-white dark:bg-dark-900 border-none shadow-soft rounded-2xl"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Badge variant="info" className="h-10 px-4 rounded-xl font-bold">
            {filteredStudents.length} Students
          </Badge>
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No students found' : 'No Students Enrolled'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'No students are enrolled in this class yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-soft-lg transition-all duration-300 group border-none shadow-soft overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start gap-5">
                    {/* Student Photo */}
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border-4 border-white dark:border-dark-800 shadow-soft group-hover:scale-110 transition-transform duration-500">
                      {student.profilePhoto ? (
                        <img 
                          src={student.profilePhoto} 
                          alt={`${student.firstName} ${student.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <User className="w-10 h-10 text-primary-700/40" />
                        </div>
                      )}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-700 transition-colors">
                          {student.firstName} {student.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            ID: {student.studentId}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                          Roll: {student.rollNumber || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {student.email && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 group/item">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-dark-800 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                          <Mail className="w-4 h-4 text-gray-400 group-hover/item:text-primary-700" />
                        </div>
                        <span className="truncate font-medium">{student.email}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 group/item">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-dark-800 flex items-center justify-center group-hover/item:bg-blue-50 transition-colors">
                          <Phone className="w-4 h-4 text-gray-400 group-hover/item:text-blue-600" />
                        </div>
                        <span className="font-medium">{student.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-dark-800 border-t border-gray-100 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/50">
                  <Link 
                    href={`/teacher/students/${student.id}`}
                    className="flex items-center justify-center gap-2 py-4 hover:bg-white dark:hover:bg-dark-800 transition-all group/btn"
                  >
                    <Eye className="w-4 h-4 text-gray-400 group-hover/btn:text-primary-700" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight group-hover/btn:text-gray-900">View Profile</span>
                  </Link>
                  <Link 
                    href={`/teacher/students/${student.id}/edit`}
                    className="flex items-center justify-center gap-2 py-4 hover:bg-white dark:hover:bg-dark-800 transition-all group/btn"
                  >
                    <Edit className="w-4 h-4 text-gray-400 group-hover/btn:text-blue-600" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight group-hover/btn:text-gray-900">Edit Profile</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
