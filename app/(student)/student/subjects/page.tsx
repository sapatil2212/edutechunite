'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Search, 
  Loader2, 
  Book, 
  User, 
  Clock,
  ChevronRight,
  Library,
  FileText,
  Video,
  Globe
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Subject {
  id: string
  name: string
  code: string
  description: string | null
  type: string
  color: string | null
  creditsPerWeek: number
}

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/institution/subjects')
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

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Subjects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your curriculum and subject details</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search subjects..." 
            className="pl-10 rounded-xl border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="border-none shadow-soft hover:shadow-md transition-all duration-300 group overflow-hidden">
            <div 
              className="h-2 w-full" 
              style={{ backgroundColor: subject.color || '#6B7280' }}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={subject.type === 'CORE' ? 'primary' : 'secondary'} className="font-bold text-[10px] uppercase tracking-wider">
                  {subject.type}
                </Badge>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-50 dark:bg-dark-900/50 px-2 py-1 rounded-lg">
                  <Clock className="w-3 h-3" />
                  {subject.creditsPerWeek} Credits
                </div>
              </div>
              <CardTitle className="text-xl font-bold group-hover:text-primary-600 transition-colors">
                {subject.name}
              </CardTitle>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{subject.code}</p>
            </CardHeader>
            <CardContent>
              {subject.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 leading-relaxed">
                  {subject.description}
                </p>
              )}
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="flex flex-col items-center justify-center p-2 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-dark-800 group-hover:border-primary-100 transition-all">
                  <FileText className="w-4 h-4 text-gray-400 group-hover:text-primary-500 mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Notes</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-dark-800 group-hover:border-primary-100 transition-all">
                  <Video className="w-4 h-4 text-gray-400 group-hover:text-primary-500 mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Videos</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-dark-800 group-hover:border-primary-100 transition-all">
                  <Globe className="w-4 h-4 text-gray-400 group-hover:text-primary-500 mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Links</span>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-2xl text-sm font-bold hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all">
                View Curriculum
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <Card className="border-none shadow-soft p-12 text-center">
          <Library className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No subjects found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your search query or check back later.</p>
        </Card>
      )}
    </div>
  )
}
