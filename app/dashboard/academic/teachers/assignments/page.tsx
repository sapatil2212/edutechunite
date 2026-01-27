'use client'

import React, { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchableDropdown, DropdownOption } from '@/components/ui/searchable-dropdown'
import { 
  Users, 
  BookOpen, 
  Plus, 
  X, 
  ChevronDown,
  UserCheck,
  Briefcase,
  AlertTriangle,
  Check,
  Search,
  Filter,
} from 'lucide-react'

interface Teacher {
  id: string
  fullName: string
  employeeId: string
  email: string | null
  specialization: string | null
}

interface Subject {
  id: string
  name: string
  code: string
  type: string
  color: string | null
}

interface AcademicUnit {
  id: string
  name: string
  type: string
  parent?: { id: string; name: string } | null
}

interface AcademicYear {
  id: string
  name: string
  isCurrent: boolean
}

interface ClassTeacher {
  id: string
  isPrimary: boolean
  isActive: boolean
  teacher: Teacher
  academicUnit: AcademicUnit
  academicYear: AcademicYear
}

interface TeacherAssignment {
  id: string
  assignmentType: string
  isPrimary: boolean
  periodsPerWeek: number | null
  isActive: boolean
  teacher: Teacher
  subject: Subject
  academicUnit: AcademicUnit
  academicYear: AcademicYear
}

// Helper function to sort academic units by class and division
const getSortedAcademicUnits = (units: AcademicUnit[]): DropdownOption[] => {
  // Separate parent classes (no parent) and sections (have parent)
  const parentClasses = units.filter(u => !u.parent)
  const sections = units.filter(u => u.parent)
  
  // Create a map of parent class ID to its sections
  const parentToSections = new Map<string, AcademicUnit[]>()
  sections.forEach(section => {
    if (section.parent) {
      const existing = parentToSections.get(section.parent.id) || []
      existing.push(section)
      parentToSections.set(section.parent.id, existing)
    }
  })
  
  // Sort parent classes by name (extract numeric part for proper sorting)
  const sortByName = (a: string, b: string) => {
    // Extract numbers for numeric comparison (e.g., "Class 1" vs "Class 10")
    const numA = parseInt(a.replace(/\D/g, '')) || 0
    const numB = parseInt(b.replace(/\D/g, '')) || 0
    if (numA !== numB) return numA - numB
    return a.localeCompare(b)
  }
  
  parentClasses.sort((a, b) => sortByName(a.name, b.name))
  
  const sortedOptions: DropdownOption[] = []
  
  // For each parent class, add it and its sorted sections
  parentClasses.forEach(parent => {
    const classSections = parentToSections.get(parent.id) || []
    
    if (classSections.length === 0) {
      // Class without sections - add the class itself
      sortedOptions.push({
        value: parent.id,
        label: parent.name,
        description: parent.type,
      })
    } else {
      // Sort sections alphabetically (A, B, C...)
      classSections.sort((a, b) => sortByName(a.name, b.name))
      
      // Add each section with parent class name
      classSections.forEach(section => {
        sortedOptions.push({
          value: section.id,
          label: `${parent.name} - ${section.name}`,
          description: section.type,
        })
      })
    }
  })
  
  // Add any orphan sections (sections whose parent is not in parentClasses)
  sections.forEach(section => {
    if (section.parent && !parentClasses.find(p => p.id === section.parent?.id)) {
      sortedOptions.push({
        value: section.id,
        label: section.parent ? `${section.parent.name} - ${section.name}` : section.name,
        description: section.type,
      })
    }
  })
  
  return sortedOptions
}

export default function TeacherAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<'class-teachers' | 'subject-teachers'>('class-teachers')
  const [isLoading, setIsLoading] = useState(true)
  const [classTeachers, setClassTeachers] = useState<ClassTeacher[]>([])
  const [subjectAssignments, setSubjectAssignments] = useState<TeacherAssignment[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showClassTeacherModal, setShowClassTeacherModal] = useState(false)
  const [showSubjectTeacherModal, setShowSubjectTeacherModal] = useState(false)
  const [formError, setFormError] = useState('')
  const [formWarnings, setFormWarnings] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [classTeacherForm, setClassTeacherForm] = useState({
    academicUnitId: '',
    teacherId: '',
    isPrimary: true,
  })

  const [subjectTeacherForm, setSubjectTeacherForm] = useState({
    academicUnitId: '',
    subjectId: '',
    teacherId: '',
    assignmentType: 'REGULAR',
    periodsPerWeek: '',
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedYear) {
      fetchAssignments()
    }
  }, [selectedYear, activeTab])

  const fetchInitialData = async () => {
    try {
      const [yearsRes, teachersRes, subjectsRes, unitsRes] = await Promise.all([
        fetch('/api/institution/academic-years'),
        fetch('/api/institution/teachers'),
        fetch('/api/institution/subjects'),
        fetch('/api/institution/academic-units'),
      ])

      const yearsData = await yearsRes.json()
      const teachersData = await teachersRes.json()
      const subjectsData = await subjectsRes.json()
      const unitsData = await unitsRes.json()

      if (yearsData.success) {
        setAcademicYears(yearsData.data)
        const currentYear = yearsData.data.find((y: AcademicYear) => y.isCurrent)
        if (currentYear) {
          setSelectedYear(currentYear.id)
        }
      }
      if (teachersData.success) setTeachers(teachersData.data)
      if (subjectsData.success) setSubjects(subjectsData.data)
      if (unitsData.success) setAcademicUnits(unitsData.data)
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAssignments = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'class-teachers') {
        const res = await fetch(`/api/institution/class-teachers?academicYearId=${selectedYear}`)
        const data = await res.json()
        if (data.success) setClassTeachers(data.data)
      } else {
        const res = await fetch(`/api/institution/teacher-assignments?academicYearId=${selectedYear}`)
        const data = await res.json()
        if (data.success) setSubjectAssignments(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClassTeacherSubmit = async (e: React.FormEvent, override = false) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/institution/class-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: selectedYear,
          ...classTeacherForm,
          overrideWarnings: override,
        }),
      })

      const data = await res.json()

      if (data.requiresConfirmation && !override) {
        setFormWarnings(data.warnings)
        return
      }

      if (data.success) {
        setShowClassTeacherModal(false)
        setClassTeacherForm({ academicUnitId: '', teacherId: '', isPrimary: true })
        setFormWarnings([])
        fetchAssignments()
      } else {
        setFormError(data.message)
      }
    } catch (error) {
      setFormError('Failed to assign class teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubjectTeacherSubmit = async (e: React.FormEvent, override = false) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/institution/teacher-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: selectedYear,
          ...subjectTeacherForm,
          periodsPerWeek: subjectTeacherForm.periodsPerWeek ? parseInt(subjectTeacherForm.periodsPerWeek) : null,
          overrideWarnings: override,
        }),
      })

      const data = await res.json()

      if (data.requiresConfirmation && !override) {
        setFormWarnings(data.warnings)
        return
      }

      if (data.success) {
        setShowSubjectTeacherModal(false)
        setSubjectTeacherForm({ academicUnitId: '', subjectId: '', teacherId: '', assignmentType: 'REGULAR', periodsPerWeek: '' })
        setFormWarnings([])
        fetchAssignments()
      } else {
        setFormError(data.message)
      }
    } catch (error) {
      setFormError('Failed to assign subject teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAssignment = async (id: string, type: 'class-teacher' | 'subject-teacher') => {
    if (!confirm('Are you sure you want to remove this assignment?')) return

    try {
      const endpoint = type === 'class-teacher' 
        ? `/api/institution/class-teachers/${id}`
        : `/api/institution/teacher-assignments/${id}`
      
      const res = await fetch(endpoint, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        fetchAssignments()
      }
    } catch (error) {
      console.error('Failed to remove assignment:', error)
    }
  }

  const filteredClassTeachers = classTeachers.filter(ct =>
    ct.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ct.academicUnit.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSubjectAssignments = subjectAssignments.filter(sa =>
    sa.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sa.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sa.academicUnit.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getAssignmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      REGULAR: 'Regular',
      TEAM_TEACHING: 'Team Teaching',
      SUBSTITUTE: 'Substitute',
      GUEST: 'Guest',
      ASSISTANT: 'Assistant',
      LAB_INSTRUCTOR: 'Lab Instructor',
      ACTIVITY: 'Activity',
    }
    return labels[type] || type
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />
      
      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Teacher Assignments
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage class teachers and subject teacher assignments for your institution.
            </p>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Academic Year:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
              >
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.isCurrent && '(Current)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by teacher, class, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-dark-700 mb-6">
            <button
              onClick={() => setActiveTab('class-teachers')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'class-teachers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <UserCheck className="w-4 h-4 inline-block mr-2" />
              Class Teachers ({classTeachers.length})
            </button>
            <button
              onClick={() => setActiveTab('subject-teachers')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'subject-teachers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline-block mr-2" />
              Subject Teachers ({subjectAssignments.length})
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : activeTab === 'class-teachers' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Class Teacher Assignments
                </h2>
                <button
                  onClick={() => setShowClassTeacherModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Assign Class Teacher
                </button>
              </div>

              {filteredClassTeachers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No class teachers assigned yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredClassTeachers.map((ct) => (
                    <Card key={ct.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {ct.academicUnit.name}
                                </h3>
                                <Badge variant={ct.isPrimary ? 'primary' : 'secondary'}>
                                  {ct.isPrimary ? 'Primary' : 'Co-Teacher'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {ct.teacher.fullName} ({ct.teacher.employeeId})
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAssignment(ct.id, 'class-teacher')}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove assignment"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Subject Teacher Assignments
                </h2>
                <button
                  onClick={() => setShowSubjectTeacherModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Assign Subject Teacher
                </button>
              </div>

              {filteredSubjectAssignments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No subject teachers assigned yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-dark-800">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Class
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Teacher
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Periods/Week
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                      {filteredSubjectAssignments.map((sa) => (
                        <tr key={sa.id} className="bg-white dark:bg-dark-900">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {sa.academicUnit.name}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {sa.subject.color && (
                                <span 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: sa.subject.color }}
                                />
                              )}
                              <span className="text-sm text-gray-900 dark:text-white">
                                {sa.subject.name}
                              </span>
                              <span className="text-xs text-gray-500">({sa.subject.code})</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {sa.teacher.fullName}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">
                              {getAssignmentTypeLabel(sa.assignmentType)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {sa.periodsPerWeek || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveAssignment(sa.id, 'subject-teacher')}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove assignment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Class Teacher Modal */}
      {showClassTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-dark-900 rounded-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign Class Teacher
              </h2>
              <button
                onClick={() => { setShowClassTeacherModal(false); setFormWarnings([]); setFormError(''); }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {formError}
              </div>
            )}

            {formWarnings.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      Please confirm the following:
                    </p>
                    <ul className="mt-2 text-sm text-yellow-600 dark:text-yellow-500 list-disc list-inside">
                      {formWarnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => handleClassTeacherSubmit(e, true)}
                        className="px-3 py-1.5 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                      >
                        Confirm & Assign
                      </button>
                      <button
                        onClick={() => setFormWarnings([])}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleClassTeacherSubmit} className="space-y-4">
              <SearchableDropdown
                label="Class / Section"
                required
                placeholder="Search and select class..."
                searchPlaceholder="Search classes..."
                value={classTeacherForm.academicUnitId}
                onChange={(value) => setClassTeacherForm({ ...classTeacherForm, academicUnitId: value })}
                options={getSortedAcademicUnits(academicUnits)}
              />

              <SearchableDropdown
                label="Teacher"
                required
                placeholder="Search and select teacher..."
                searchPlaceholder="Search by name or ID..."
                value={classTeacherForm.teacherId}
                onChange={(value) => setClassTeacherForm({ ...classTeacherForm, teacherId: value })}
                options={teachers.map((teacher): DropdownOption => ({
                  value: teacher.id,
                  label: teacher.fullName,
                  description: `${teacher.employeeId}${teacher.specialization ? ` • ${teacher.specialization}` : ''}`,
                }))}
              />

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={classTeacherForm.isPrimary}
                    onChange={(e) => setClassTeacherForm({ ...classTeacherForm, isPrimary: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Primary Class Teacher
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowClassTeacherModal(false); setFormWarnings([]); setFormError(''); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 font-medium text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Class Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Teacher Modal */}
      {showSubjectTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-dark-900 rounded-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign Subject Teacher
              </h2>
              <button
                onClick={() => { setShowSubjectTeacherModal(false); setFormWarnings([]); setFormError(''); }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {formError}
              </div>
            )}

            {formWarnings.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      Please confirm the following:
                    </p>
                    <ul className="mt-2 text-sm text-yellow-600 dark:text-yellow-500 list-disc list-inside">
                      {formWarnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => handleSubjectTeacherSubmit(e, true)}
                        className="px-3 py-1.5 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                      >
                        Confirm & Assign
                      </button>
                      <button
                        onClick={() => setFormWarnings([])}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubjectTeacherSubmit} className="space-y-4">
              <SearchableDropdown
                label="Class / Section"
                required
                placeholder="Search and select class..."
                searchPlaceholder="Search classes..."
                value={subjectTeacherForm.academicUnitId}
                onChange={(value) => setSubjectTeacherForm({ ...subjectTeacherForm, academicUnitId: value })}
                options={getSortedAcademicUnits(academicUnits)}
              />

              <SearchableDropdown
                label="Subject"
                required
                placeholder="Search and select subject..."
                searchPlaceholder="Search by name or code..."
                value={subjectTeacherForm.subjectId}
                onChange={(value) => setSubjectTeacherForm({ ...subjectTeacherForm, subjectId: value })}
                options={subjects.map((subject): DropdownOption => ({
                  value: subject.id,
                  label: subject.name,
                  description: subject.code,
                  color: subject.color || undefined,
                }))}
              />

              <SearchableDropdown
                label="Teacher"
                required
                placeholder="Search and select teacher..."
                searchPlaceholder="Search by name or ID..."
                value={subjectTeacherForm.teacherId}
                onChange={(value) => setSubjectTeacherForm({ ...subjectTeacherForm, teacherId: value })}
                options={teachers.map((teacher): DropdownOption => ({
                  value: teacher.id,
                  label: teacher.fullName,
                  description: `${teacher.employeeId}${teacher.specialization ? ` • ${teacher.specialization}` : ''}`,
                }))}
              />

              <SearchableDropdown
                label="Assignment Type"
                placeholder="Select assignment type..."
                value={subjectTeacherForm.assignmentType}
                onChange={(value) => setSubjectTeacherForm({ ...subjectTeacherForm, assignmentType: value })}
                options={[
                  { value: 'REGULAR', label: 'Regular', description: 'Full-time assigned teacher' },
                  { value: 'TEAM_TEACHING', label: 'Team Teaching', description: 'Multiple teachers for the same subject' },
                  { value: 'SUBSTITUTE', label: 'Substitute', description: 'Temporary replacement teacher' },
                  { value: 'GUEST', label: 'Guest Faculty', description: 'External visiting faculty' },
                  { value: 'ASSISTANT', label: 'Teaching Assistant', description: 'Supports the primary teacher' },
                  { value: 'LAB_INSTRUCTOR', label: 'Lab Instructor', description: 'Handles practical/lab sessions' },
                  { value: 'ACTIVITY', label: 'Activity Instructor', description: 'Non-academic activities' },
                ]}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Periods Per Week (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={subjectTeacherForm.periodsPerWeek}
                  onChange={(e) => setSubjectTeacherForm({ ...subjectTeacherForm, periodsPerWeek: e.target.value })}
                  placeholder="e.g., 5"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowSubjectTeacherModal(false); setFormWarnings([]); setFormError(''); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 font-medium text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Subject Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
