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
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
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
  classId?: string | null
  sectionId?: string | null
  className?: string | null
  sectionName?: string | null
  effectiveFrom?: string
  notes?: string | null
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
    classId: '',
    sectionId: '',
    teacherId: '',
    isPrimary: true,
    notes: '',
  })

  // View/Edit modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<ClassTeacher | TeacherAssignment | null>(null)
  const [editForm, setEditForm] = useState({
    teacherId: '',
    isPrimary: true,
    notes: '',
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
        setClassTeacherForm({ classId: '', sectionId: '', teacherId: '', isPrimary: true, notes: '' })
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

  const handleViewAssignment = (assignment: ClassTeacher | TeacherAssignment) => {
    setSelectedAssignment(assignment)
    setShowViewModal(true)
  }

  const handleEditAssignment = (assignment: ClassTeacher | TeacherAssignment) => {
    setSelectedAssignment(assignment)
    setEditForm({
      teacherId: assignment.teacher.id,
      isPrimary: assignment.isPrimary,
      notes: 'notes' in assignment ? (assignment.notes || '') : '',
    })
    setShowEditModal(true)
  }

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment) return
    
    setIsSubmitting(true)
    setFormError('')

    try {
      const isClassTeacher = 'className' in selectedAssignment || !('subject' in selectedAssignment)
      const endpoint = isClassTeacher
        ? `/api/institution/class-teachers/${selectedAssignment.id}`
        : `/api/institution/teacher-assignments/${selectedAssignment.id}`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const data = await res.json()

      if (data.success) {
        setShowEditModal(false)
        setSelectedAssignment(null)
        fetchAssignments()
      } else {
        setFormError(data.message)
      }
    } catch (error) {
      setFormError('Failed to update assignment')
    } finally {
      setIsSubmitting(false)
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
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Click &quot;Assign Class Teacher&quot; to add your first assignment
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Class / Section
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Teacher
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                          {filteredClassTeachers.map((ct) => (
                            <tr key={ct.id} className="bg-white dark:bg-dark-900 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {ct.className || ct.academicUnit.parent?.name || ct.academicUnit.name}
                                    </p>
                                    {(ct.sectionName || ct.academicUnit.parent) && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {ct.sectionName || ct.academicUnit.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {ct.teacher.fullName}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {ct.teacher.employeeId}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={ct.isPrimary ? 'primary' : 'secondary'}>
                                  {ct.isPrimary ? 'Primary' : 'Co-Teacher'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={ct.isActive ? 'success' : 'secondary'}>
                                  {ct.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleViewAssignment(ct)}
                                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="View details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditAssignment(ct)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Edit assignment"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveAssignment(ct.id, 'class-teacher')}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Remove assignment"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
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
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Click &quot;Assign Subject Teacher&quot; to add your first assignment
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Class / Section
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Subject
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Teacher
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Periods/Week
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                          {filteredSubjectAssignments.map((sa) => (
                            <tr key={sa.id} className="bg-white dark:bg-dark-900 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {sa.academicUnit.parent?.name || sa.academicUnit.name}
                                    </p>
                                    {sa.academicUnit.parent && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {sa.academicUnit.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {sa.subject.color && (
                                    <span 
                                      className="w-3 h-3 rounded-full flex-shrink-0" 
                                      style={{ backgroundColor: sa.subject.color }}
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {sa.subject.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {sa.subject.code}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {sa.teacher.fullName}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {sa.teacher.employeeId}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="secondary">
                                  {getAssignmentTypeLabel(sa.assignmentType)}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {sa.periodsPerWeek || '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleViewAssignment(sa)}
                                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="View details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditAssignment(sa)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Edit assignment"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveAssignment(sa.id, 'subject-teacher')}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Remove assignment"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="" disabled>Select academic year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name} {year.isCurrent && '(Current)'}
                    </option>
                  ))}
                </select>
              </div>

              <SearchableDropdown
                label="Select Class"
                required
                placeholder="Search and select class..."
                searchPlaceholder="Search classes..."
                value={classTeacherForm.classId}
                onChange={(value) => {
                  setClassTeacherForm({ ...classTeacherForm, classId: value, sectionId: '' })
                }}
                options={academicUnits
                  .filter(u => !u.parent)
                  .sort((a, b) => {
                    const numA = parseInt(a.name.replace(/\D/g, '')) || 0
                    const numB = parseInt(b.name.replace(/\D/g, '')) || 0
                    return numA !== numB ? numA - numB : a.name.localeCompare(b.name)
                  })
                  .map((unit): DropdownOption => ({
                    value: unit.id,
                    label: unit.name,
                    description: unit.type,
                  }))}
              />

              <SearchableDropdown
                label="Select Section"
                placeholder="Select section (optional)..."
                searchPlaceholder="Search sections..."
                value={classTeacherForm.sectionId}
                onChange={(value) => setClassTeacherForm({ ...classTeacherForm, sectionId: value })}
                options={academicUnits
                  .filter(u => u.parent?.id === classTeacherForm.classId)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((unit): DropdownOption => ({
                    value: unit.id,
                    label: unit.name,
                    description: unit.type,
                  }))}
                disabled={!classTeacherForm.classId}
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

              <div className="space-y-3">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={classTeacherForm.notes}
                    onChange={(e) => setClassTeacherForm({ ...classTeacherForm, notes: e.target.value })}
                    placeholder="Add any notes about this assignment..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg resize-none"
                  />
                </div>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="" disabled>Select academic year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name} {year.isCurrent && '(Current)'}
                    </option>
                  ))}
                </select>
              </div>

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

      {/* View Assignment Modal */}
      {showViewModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-dark-900 rounded-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assignment Details
              </h2>
              <button
                onClick={() => { setShowViewModal(false); setSelectedAssignment(null); }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Class/Section Info */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Class / Section</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {'className' in selectedAssignment && selectedAssignment.className 
                      ? `${selectedAssignment.className}${selectedAssignment.sectionName ? ` - ${selectedAssignment.sectionName}` : ''}`
                      : selectedAssignment.academicUnit.parent 
                        ? `${selectedAssignment.academicUnit.parent.name} - ${selectedAssignment.academicUnit.name}`
                        : selectedAssignment.academicUnit.name
                    }
                  </p>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Teacher</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedAssignment.teacher.fullName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {selectedAssignment.teacher.employeeId}
                  </p>
                  {selectedAssignment.teacher.email && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <Mail className="w-3 h-3" />
                      {selectedAssignment.teacher.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Role</p>
                  <Badge variant={selectedAssignment.isPrimary ? 'primary' : 'secondary'}>
                    {selectedAssignment.isPrimary ? 'Primary Teacher' : 'Co-Teacher'}
                  </Badge>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                  <Badge variant={selectedAssignment.isActive ? 'success' : 'secondary'}>
                    {selectedAssignment.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              {'notes' in selectedAssignment && selectedAssignment.notes && (
                <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                  <p className="text-gray-900 dark:text-white">{selectedAssignment.notes}</p>
                </div>
              )}

              {/* Effective From */}
              {'effectiveFrom' in selectedAssignment && selectedAssignment.effectiveFrom && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  Effective from: {new Date(selectedAssignment.effectiveFrom).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
              <button
                onClick={() => { setShowViewModal(false); setSelectedAssignment(null); }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  handleEditAssignment(selectedAssignment)
                }}
                className="px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 font-medium text-sm"
              >
                Edit Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-dark-900 rounded-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Assignment
              </h2>
              <button
                onClick={() => { setShowEditModal(false); setSelectedAssignment(null); setFormError(''); }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Assignment Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Editing assignment for</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {'className' in selectedAssignment && selectedAssignment.className 
                  ? `${selectedAssignment.className}${selectedAssignment.sectionName ? ` - ${selectedAssignment.sectionName}` : ''}`
                  : selectedAssignment.academicUnit.parent 
                    ? `${selectedAssignment.academicUnit.parent.name} - ${selectedAssignment.academicUnit.name}`
                    : selectedAssignment.academicUnit.name
                }
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateAssignment} className="space-y-4">
              <SearchableDropdown
                label="Teacher"
                required
                placeholder="Search and select teacher..."
                searchPlaceholder="Search by name or ID..."
                value={editForm.teacherId}
                onChange={(value) => setEditForm({ ...editForm, teacherId: value })}
                options={teachers.map((teacher): DropdownOption => ({
                  value: teacher.id,
                  label: teacher.fullName,
                  description: `${teacher.employeeId}${teacher.specialization ? ` • ${teacher.specialization}` : ''}`,
                }))}
              />

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.isPrimary}
                    onChange={(e) => setEditForm({ ...editForm, isPrimary: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Primary Class Teacher
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Add any notes about this assignment..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedAssignment(null); setFormError(''); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 font-medium text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
