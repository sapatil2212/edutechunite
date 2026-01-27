'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  GraduationCap,
  ChevronRight,
  MoreVertical,
  Loader2,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

interface Student {
  id: string
  admissionNumber: string
  rollNumber: string | null
  fullName: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  profilePhoto: string | null
  className: string
  status: string
}

export default function TeacherAllStudentsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/institution/teachers/all-students')
      const data = await res.json()
      if (data.success) {
        setStudents(data.data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const classes = Array.from(new Set(students.map(s => s.className))).sort()

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = selectedClass === 'all' || student.className === selectedClass
    return matchesSearch && matchesClass
  })

  if (isLoading) {
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
            My Students
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage students across all your assigned classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="px-3 py-1 text-sm font-bold">
            {students.length} Total Students
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or admission number..."
                className="pl-9 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <select
                className="h-11 px-4 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <Button variant="ghost" className="h-11 rounded-xl border border-gray-100 dark:border-dark-700">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card 
              key={student.id} 
              className="group hover:shadow-lg transition-all duration-300 border-none shadow-soft overflow-hidden bg-white dark:bg-dark-800"
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary-700 font-bold text-xl overflow-hidden shadow-sm">
                        {student.profilePhoto ? (
                          <img src={student.profilePhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          student.fullName.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-700 transition-colors">
                          {student.fullName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="secondary" className="font-bold">
                            #{student.rollNumber || 'N/A'}
                          </Badge>
                          <span>ID: {student.admissionNumber}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-primary-700" />
                      </div>
                      <span className="font-medium">{student.className}</span>
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-green-500" />
                        </div>
                        <span>{student.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link 
                      href={`/teacher/students/${student.id}`} 
                      className="flex-1"
                    >
                      <Button className="w-full bg-primary hover:bg-primary-600 text-black border-none rounded-xl h-10 font-bold">
                        View Profile
                      </Button>
                    </Link>
                    <Link href={`/teacher/students/${student.id}/edit`}>
                      <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl border border-gray-100 dark:border-dark-700 hover:bg-gray-50">
                        <ChevronRight className="w-5 h-5" />
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
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Students Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We couldn't find any students matching your current search or filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
