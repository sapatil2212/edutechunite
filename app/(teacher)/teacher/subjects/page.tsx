'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Search, 
  Loader2,
  Users,
  Clock,
  ChevronRight,
  BookMarked
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface Subject {
  id: string
  name: string
  code: string
  type: string
  color: string | null
  classes: { id: string; name: string }[]
}

export default function TeacherSubjectsPage() {
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/institution/teachers/subjects')
      const data = await res.json()
      if (data.success) {
        setSubjects(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubjects = subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            My Subjects
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all subjects you are currently teaching across different classes
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search subjects..."
            className="pl-9 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <Card 
              key={subject.id} 
              className="group hover:shadow-lg transition-all duration-300 border-none shadow-soft overflow-hidden bg-white dark:bg-dark-800"
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm`}
                      style={{ backgroundColor: subject.color ? `${subject.color}20` : '#E5F33C20' }}
                    >
                      <BookMarked 
                        className="w-7 h-7" 
                        style={{ color: subject.color || '#718300' }} 
                      />
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {subject.code}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-700 transition-colors">
                    {subject.name}
                  </h3>
                  <Badge className="mb-6 capitalize">
                    {subject.type.toLowerCase()} Subject
                  </Badge>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">
                        Assigned Classes ({subject.classes.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {subject.classes.map(cls => (
                          <Link 
                            key={cls.id} 
                            href={`/teacher/classes/${cls.id}`}
                            className="inline-flex items-center px-3 py-1 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary-700 transition-all"
                          >
                            {cls.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-dark-800 border-t border-gray-100 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/50">
                  <Link
                    href={`/teacher/resources?subjectId=${subject.id}`}
                    className="flex items-center justify-center gap-2 py-4 hover:bg-white dark:hover:bg-dark-800 transition-all group/action"
                  >
                    <BookOpen className="w-4 h-4 text-gray-400 group-hover/action:text-primary-700" />
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Resources</span>
                  </Link>
                  <Link
                    href={`/teacher/assignments?subjectId=${subject.id}`}
                    className="flex items-center justify-center gap-2 py-4 hover:bg-white dark:hover:bg-dark-800 transition-all group/action"
                  >
                    <Clock className="w-4 h-4 text-gray-400 group-hover/action:text-blue-500" />
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Assignments</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-soft py-20 text-center bg-white dark:bg-dark-800">
          <CardContent>
            <div className="w-20 h-20 bg-gray-50 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Subjects Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              You haven't been assigned any subjects yet or none match your search.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
