'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  FileText,
  Edit,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Heart,
  Building2,
  Hash,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface StudentProfile {
  id: string
  admissionNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  fullName: string
  dateOfBirth: string
  gender: string
  bloodGroup: string | null
  nationality: string | null
  email: string | null
  phone: string | null
  emergencyContact: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  profilePhoto: string | null
  stream: string | null
  program: string | null
  rollNumber: string | null
  status: string
  admissionDate: string
  previousSchool: string | null
  previousClass: string | null
  academicYear: { id: string; name: string; isCurrent: boolean }
  academicUnit: { id: string; name: string; type: string; parent?: { id: string; name: string } | null }
  guardians: Array<{
    isPrimary: boolean
    guardian: {
      id: string
      fullName: string
      phone: string
      email: string | null
      relationship: string
      occupation: string | null
      organization: string | null
      address: string | null
      alternatePhone: string | null
    }
  }>
  documents: Array<{
    id: string
    documentType: string
    name: string
    fileUrl: string
    isVerified: boolean
  }>
  attendanceStats: {
    total: number
    present: number
    absent: number
    late: number
    onLeave: number
    percentage: number
  }
}

export default function TeacherStudentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params?.studentId as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [student, setStudent] = useState<StudentProfile | null>(null)

  useEffect(() => {
    if (studentId) {
      fetchStudentProfile()
    }
  }, [studentId])

  const fetchStudentProfile = async () => {
    try {
      const res = await fetch(`/api/institution/teachers/students/${studentId}`)
      const data = await res.json()
      
      if (data.success) {
        setStudent(data.data)
      } else {
        setError(data.error || 'Failed to fetch student profile')
      }
    } catch (err) {
      console.error('Error fetching student:', err)
      setError('Failed to fetch student profile')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      MALE: 'Male',
      FEMALE: 'Female',
      OTHER: 'Other',
    }
    return labels[gender] || gender
  }

  const getBloodGroupLabel = (bloodGroup: string | null) => {
    if (!bloodGroup) return '-'
    const labels: Record<string, string> = {
      A_POSITIVE: 'A+',
      A_NEGATIVE: 'A-',
      B_POSITIVE: 'B+',
      B_NEGATIVE: 'B-',
      O_POSITIVE: 'O+',
      O_NEGATIVE: 'O-',
      AB_POSITIVE: 'AB+',
      AB_NEGATIVE: 'AB-',
    }
    return labels[bloodGroup] || bloodGroup
  }

  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      FATHER: 'Father',
      MOTHER: 'Mother',
      GUARDIAN: 'Guardian',
      GRANDPARENT: 'Grandparent',
      SIBLING: 'Sibling',
      OTHER: 'Other',
    }
    return labels[relationship] || relationship
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {error || 'Student not found'}
        </h2>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Profile Photo */}
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white dark:border-dark-700 shadow-xl">
              {student.profilePhoto ? (
                <img 
                  src={student.profilePhoto} 
                  alt={student.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-primary-700 dark:text-primary-400" />
              )}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {student.fullName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary">{student.admissionNumber}</Badge>
                {student.rollNumber && (
                  <Badge variant="primary">Roll: {student.rollNumber}</Badge>
                )}
                <Badge 
                  variant={student.status === 'ACTIVE' ? 'primary' : 'secondary'}
                  className={student.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}
                >
                  {student.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {student.academicUnit.parent 
                  ? `${student.academicUnit.parent.name} - ${student.academicUnit.name}`
                  : student.academicUnit.name
                } • {student.academicYear.name}
              </p>
            </div>
          </div>

          <Link href={`/teacher/students/${studentId}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                <InfoRow icon={User} label="Gender" value={getGenderLabel(student.gender)} />
                <InfoRow icon={Heart} label="Blood Group" value={getBloodGroupLabel(student.bloodGroup)} />
                <InfoRow icon={Building2} label="Nationality" value={student.nationality || '-'} />
                <InfoRow icon={Calendar} label="Admission Date" value={formatDate(student.admissionDate)} />
                <InfoRow icon={Hash} label="Roll Number" value={student.rollNumber || '-'} />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow icon={Mail} label="Email" value={student.email || '-'} />
                <InfoRow icon={Phone} label="Phone" value={student.phone || '-'} />
                <InfoRow icon={Phone} label="Emergency Contact" value={student.emergencyContact || '-'} />
              </div>
              
              {student.address && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {student.address}
                        {student.city && `, ${student.city}`}
                        {student.state && `, ${student.state}`}
                        {student.pincode && ` - ${student.pincode}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
            <CardHeader className="border-b border-gray-50 dark:border-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-primary" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow icon={Calendar} label="Academic Year" value={student.academicYear.name} />
                <InfoRow 
                  icon={Building2} 
                  label="Class/Section" 
                  value={student.academicUnit.parent 
                    ? `${student.academicUnit.parent.name} - ${student.academicUnit.name}`
                    : student.academicUnit.name
                  } 
                />
                {student.stream && (
                  <InfoRow icon={GraduationCap} label="Stream" value={student.stream} />
                )}
                {student.program && (
                  <InfoRow icon={GraduationCap} label="Program" value={student.program} />
                )}
              </div>

              {(student.previousSchool || student.previousClass) && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Previous Education</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {student.previousSchool && (
                      <InfoRow icon={Building2} label="Previous School" value={student.previousSchool} />
                    )}
                    {student.previousClass && (
                      <InfoRow icon={GraduationCap} label="Previous Class" value={student.previousClass} />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guardians */}
          {student.guardians.length > 0 && (
            <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
              <CardHeader className="border-b border-gray-50 dark:border-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-primary" />
                  Guardians
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {student.guardians.map((sg, index) => (
                    <div 
                      key={sg.guardian.id}
                      className={`p-5 rounded-2xl transition-all ${
                        sg.isPrimary 
                          ? 'bg-primary/5 border-2 border-primary/20 ring-4 ring-primary/5' 
                          : 'bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {sg.guardian.fullName}
                            </h4>
                            {sg.isPrimary && (
                              <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider">Primary</Badge>
                            )}
                          </div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {getRelationshipLabel(sg.guardian.relationship)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400 font-medium">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-dark-700 flex items-center justify-center shadow-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                          </div>
                          <span>{sg.guardian.phone}</span>
                        </div>
                        {sg.guardian.email && (
                          <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400 font-medium">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-dark-700 flex items-center justify-center shadow-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="truncate">{sg.guardian.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Percentage Circle */}
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-gray-200 dark:text-dark-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeLinecap="round"
                      className="text-primary"
                      strokeDasharray={`${(student.attendanceStats.percentage / 100) * 352} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {student.attendanceStats.percentage}%
                    </span>
                    <span className="text-xs text-gray-500">Attendance</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatBox 
                  icon={CheckCircle2} 
                  label="Present" 
                  value={student.attendanceStats.present}
                  color="text-green-500"
                  bgColor="bg-green-100 dark:bg-green-900/20"
                />
                <StatBox 
                  icon={XCircle} 
                  label="Absent" 
                  value={student.attendanceStats.absent}
                  color="text-red-500"
                  bgColor="bg-red-100 dark:bg-red-900/20"
                />
                <StatBox 
                  icon={Clock} 
                  label="Late" 
                  value={student.attendanceStats.late}
                  color="text-yellow-500"
                  bgColor="bg-yellow-100 dark:bg-yellow-900/20"
                />
                <StatBox 
                  icon={Calendar} 
                  label="On Leave" 
                  value={student.attendanceStats.onLeave}
                  color="text-blue-500"
                  bgColor="bg-blue-100 dark:bg-blue-900/20"
                />
              </div>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                Total Days: {student.attendanceStats.total}
              </p>
            </CardContent>
          </Card>

          {/* Documents */}
          {student.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {student.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500">{doc.documentType}</p>
                      </div>
                      {doc.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

// Helper Components
function InfoRow({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType
  label: string
  value: string 
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

function StatBox({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  bgColor 
}: { 
  icon: React.ElementType
  label: string
  value: number
  color: string
  bgColor: string 
}) {
  return (
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}
