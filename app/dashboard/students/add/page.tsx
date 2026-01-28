'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  GraduationCap,
  MapPin,
  Users,
  FileText,
  RefreshCw,
  Upload,
  X,
  Camera,
  DollarSign,
} from 'lucide-react'
import { StudentFeeOnboarding } from '@/components/onboarding/StudentFeeOnboarding'
import { PaymentCollectionOnboarding } from '@/components/onboarding/PaymentCollectionOnboarding'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dropdown } from '@/components/ui/dropdown'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Generate random student ID
const generateStudentId = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `STU${year}${random}`
}

interface AcademicYear {
  id: string
  name: string
  isCurrent: boolean
}

interface AcademicUnit {
  id: string
  name: string
  type: string
  maxStudents: number
  currentStudents: number
  parent?: { id: string; name: string } | null
  children?: AcademicUnit[]
}

export default function AddStudentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([])
  const [sections, setSections] = useState<AcademicUnit[]>([])
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // Fee structure and payment state
  const [feeData, setFeeData] = useState<any>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdStudentData, setCreatedStudentData] = useState<{
    studentName: string
    admissionNumber: string
    receiptNumber?: string
  } | null>(null)

  const [formData, setFormData] = useState({
    admissionNumber: generateStudentId(),
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    nationality: 'Indian',
    email: '',
    phone: '',
    emergencyContact: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    academicYearId: '',
    academicUnitId: '',
    sectionId: '',
    rollNumber: '',
    previousSchool: '',
    previousClass: '',
    guardianName: '',
    guardianRelationship: 'FATHER',
    guardianEmail: '',
    guardianPhone: '',
    guardianOccupation: '',
  })

  useEffect(() => {
    fetchAcademicYears()
  }, [])

  useEffect(() => {
    if (formData.academicYearId) {
      fetchAcademicUnits(formData.academicYearId)
    }
  }, [formData.academicYearId])

  useEffect(() => {
    if (formData.academicUnitId) {
      const unit = academicUnits.find(u => u.id === formData.academicUnitId)
      if (unit?.children && unit.children.length > 0) {
        setSections(unit.children)
      } else {
        setSections([])
        setFormData(prev => ({ ...prev, sectionId: '' }))
      }
    }
  }, [formData.academicUnitId, academicUnits])

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch('/api/institution/academic-years')
      const data = await res.json()
      if (data.success) {
        setAcademicYears(data.data || [])
        const currentYear = data.data?.find((y: AcademicYear) => y.isCurrent)
        if (currentYear) {
          setFormData(prev => ({ ...prev, academicYearId: currentYear.id }))
        }
      }
    } catch (err) {
      console.error('Error fetching academic years:', err)
    }
  }

  const fetchAcademicUnits = async (yearId: string) => {
    try {
      const res = await fetch(`/api/institution/academic-units?academicYearId=${yearId}&parentId=null&includeChildren=true`)
      const data = await res.json()
      if (data.success) {
        setAcademicUnits(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching academic units:', err)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'students')

      const res = await fetch('/api/institution/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setProfilePhoto(data.url)
      } else {
        setError(data.error || 'Failed to upload image')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const removeProfilePhoto = () => {
    setProfilePhoto(null)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.admissionNumber.trim()) {
      errors.admissionNumber = 'Admission number is required'
    }
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
    }
    if (!formData.gender) {
      errors.gender = 'Gender is required'
    }
    if (!formData.academicYearId) {
      errors.academicYearId = 'Academic year is required'
    }
    if (!formData.academicUnitId) {
      errors.academicUnitId = 'Class/Batch is required'
    }
    if (sections.length > 0 && !formData.sectionId) {
      errors.sectionId = 'Section is required'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setError('Please fill in all required fields')
      return
    }
    
    setIsSubmitting(true)
    setError('')

    try {
      const payload = {
        admissionNumber: formData.admissionNumber,
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || undefined,
        nationality: formData.nationality || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        pincode: formData.pincode || undefined,
        profilePhoto: profilePhoto || undefined,
        academicYearId: formData.academicYearId,
        academicUnitId: formData.sectionId || formData.academicUnitId,
        rollNumber: formData.rollNumber || undefined,
        previousSchool: formData.previousSchool || undefined,
        previousClass: formData.previousClass || undefined,
        guardians: formData.guardianPhone ? [
          {
            fullName: formData.guardianName,
            relationship: formData.guardianRelationship,
            email: formData.guardianEmail || undefined,
            phone: formData.guardianPhone,
            occupation: formData.guardianOccupation || undefined,
          }
        ] : undefined,
        // Fee structure and payment data
        feeData: feeData || undefined,
        paymentData: paymentData || undefined,
      }

      const res = await fetch('/api/institution/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student')
      }

      // Show success modal with student details and receipt info
      const studentFullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ')
      setCreatedStudentData({
        studentName: studentFullName,
        admissionNumber: formData.admissionNumber,
        receiptNumber: data.receiptNumber || undefined
      })
      setShowSuccessModal(true)
    } catch (err: any) {
      setError(err.message || 'Failed to create student')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/students">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Add New Student
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter student details to create a new record
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
              >
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Basic Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="admissionNumber" required className="text-xs">
                        Admission Number
                      </Label>
                      <div className="flex gap-2">
                        <input
                          id="admissionNumber"
                          type="text"
                          value={formData.admissionNumber}
                          onChange={(e) => {
                            setFormData({ ...formData, admissionNumber: e.target.value })
                            clearFieldError('admissionNumber')
                          }}
                          className={`flex-1 px-3 py-2 text-sm bg-white dark:bg-dark-900 border rounded-lg ${
                            fieldErrors.admissionNumber 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-gray-200 dark:border-dark-700'
                          }`}
                          placeholder="e.g., STU2024001"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({ ...formData, admissionNumber: generateStudentId() })
                            clearFieldError('admissionNumber')
                          }}
                          title="Generate new ID"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      {fieldErrors.admissionNumber && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.admissionNumber}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="firstName" required className="text-xs">
                        First Name
                      </Label>
                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => {
                          setFormData({ ...formData, firstName: e.target.value })
                          clearFieldError('firstName')
                        }}
                        className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border rounded-lg ${
                          fieldErrors.firstName 
                            ? 'border-red-500 dark:border-red-500' 
                            : 'border-gray-200 dark:border-dark-700'
                        }`}
                      />
                      {fieldErrors.firstName && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="middleName" className="text-xs">
                        Middle Name
                      </Label>
                      <input
                        id="middleName"
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" required className="text-xs">
                        Last Name
                      </Label>
                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => {
                          setFormData({ ...formData, lastName: e.target.value })
                          clearFieldError('lastName')
                        }}
                        className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border rounded-lg ${
                          fieldErrors.lastName 
                            ? 'border-red-500 dark:border-red-500' 
                            : 'border-gray-200 dark:border-dark-700'
                        }`}
                      />
                      {fieldErrors.lastName && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.lastName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth" required className="text-xs">
                        Date of Birth
                      </Label>
                      <input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => {
                          setFormData({ ...formData, dateOfBirth: e.target.value })
                          clearFieldError('dateOfBirth')
                        }}
                        className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border rounded-lg ${
                          fieldErrors.dateOfBirth 
                            ? 'border-red-500 dark:border-red-500' 
                            : 'border-gray-200 dark:border-dark-700'
                        }`}
                      />
                      {fieldErrors.dateOfBirth && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.dateOfBirth}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="gender" required className="text-xs">
                        Gender
                      </Label>
                      <Dropdown
                        options={[
                          { value: 'MALE', label: 'Male' },
                          { value: 'FEMALE', label: 'Female' },
                          { value: 'OTHER', label: 'Other' },
                        ]}
                        value={formData.gender}
                        onChange={(val) => {
                          setFormData({ ...formData, gender: val })
                          clearFieldError('gender')
                        }}
                        placeholder="Select Gender"
                      />
                      {fieldErrors.gender && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.gender}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="bloodGroup" className="text-xs">
                        Blood Group
                      </Label>
                      <Dropdown
                        options={[
                          { value: 'A_POSITIVE', label: 'A+' },
                          { value: 'A_NEGATIVE', label: 'A-' },
                          { value: 'B_POSITIVE', label: 'B+' },
                          { value: 'B_NEGATIVE', label: 'B-' },
                          { value: 'O_POSITIVE', label: 'O+' },
                          { value: 'O_NEGATIVE', label: 'O-' },
                          { value: 'AB_POSITIVE', label: 'AB+' },
                          { value: 'AB_NEGATIVE', label: 'AB-' },
                        ]}
                        value={formData.bloodGroup}
                        onChange={(val) => setFormData({ ...formData, bloodGroup: val })}
                        placeholder="Select Blood Group"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality" className="text-xs">
                        Nationality
                      </Label>
                      <input
                        id="nationality"
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Academic Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Academic Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="academicYearId" required className="text-xs">
                        Academic Year
                      </Label>
                      <Dropdown
                        options={academicYears.map(y => ({
                          value: y.id,
                          label: `${y.name}${y.isCurrent ? ' (Current)' : ''}`,
                        }))}
                        value={formData.academicYearId}
                        onChange={(val) => {
                          setFormData({ ...formData, academicYearId: val })
                          clearFieldError('academicYearId')
                        }}
                        placeholder="Select Academic Year"
                      />
                      {fieldErrors.academicYearId && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.academicYearId}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="academicUnitId" required className="text-xs">
                        Class/Batch
                      </Label>
                      <Dropdown
                        options={academicUnits.map(u => ({
                          value: u.id,
                          label: `${u.name} (${u.currentStudents}/${u.maxStudents})`,
                        }))}
                        value={formData.academicUnitId}
                        onChange={(val) => {
                          setFormData({ ...formData, academicUnitId: val, sectionId: '' })
                          clearFieldError('academicUnitId')
                        }}
                        placeholder="Select Class"
                      />
                      {fieldErrors.academicUnitId && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.academicUnitId}</p>
                      )}
                    </div>

                    {/* Section Dropdown - shows after class is selected */}
                    {formData.academicUnitId && sections.length > 0 && (
                      <div>
                        <Label htmlFor="sectionId" required className="text-xs">
                          Section/Division
                        </Label>
                        <Dropdown
                          options={sections.map(s => {
                            const isFull = s.currentStudents >= s.maxStudents
                            return {
                              value: s.id,
                              label: `${s.name} (${s.currentStudents}/${s.maxStudents})${isFull ? ' - Full' : ''}`,
                              disabled: isFull,
                            }
                          })}
                          value={formData.sectionId}
                          onChange={(val) => {
                            setFormData({ ...formData, sectionId: val })
                            clearFieldError('sectionId')
                          }}
                          placeholder="Select Section"
                        />
                        {fieldErrors.sectionId && (
                          <p className="text-xs text-red-500 mt-1">{fieldErrors.sectionId}</p>
                        )}
                        {/* Available sections indicator */}
                        <p className="text-xs text-gray-500 mt-1">
                          {sections.filter(s => s.currentStudents < s.maxStudents).length} of {sections.length} sections available
                        </p>
                      </div>
                    )}

                    {/* No sections available message */}
                    {formData.academicUnitId && sections.length === 0 && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                          No sections/divisions for this class. Student will be enrolled directly.
                        </p>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="rollNumber" className="text-xs">
                        Roll Number
                      </Label>
                      <input
                        id="rollNumber"
                        type="text"
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        placeholder="e.g., 01, 02, A-001"
                      />
                      <p className="text-xs text-gray-500 mt-1">Unique roll number within the class</p>
                    </div>
                  </div>
                </motion.div>

                {/* Fee Structure Section - Shows when class is selected */}
                {formData.academicYearId && formData.academicUnitId && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Fee Structure & Payment
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Fee structure is auto-loaded based on selected class
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <StudentFeeOnboarding
                        academicYearId={formData.academicYearId}
                        classId={formData.academicUnitId}
                        sectionId={formData.sectionId || undefined}
                        onFeeDataChange={setFeeData}
                      />

                      {feeData && feeData.feeStructureId && (
                        <PaymentCollectionOnboarding
                          finalAmount={feeData.finalAmount}
                          onPaymentDataChange={setPaymentData}
                        />
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Contact Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Contact Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-xs">
                        Email
                      </Label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        placeholder="student@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs">
                        Phone
                      </Label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContact" className="text-xs">
                        Emergency Contact
                      </Label>
                      <input
                        id="emergencyContact"
                        type="tel"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address" className="text-xs">
                        Address
                      </Label>
                      <textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-xs">
                        City
                      </Label>
                      <input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-xs">
                        State
                      </Label>
                      <input
                        id="state"
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode" className="text-xs">
                        Pincode
                      </Label>
                      <input
                        id="pincode"
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Profile Photo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-pink-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Profile Photo
                    </h2>
                  </div>

                  <div className="flex flex-col items-center">
                    {profilePhoto ? (
                      <div className="relative">
                        <img
                          src={profilePhoto}
                          alt="Profile preview"
                          className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200 dark:border-dark-600"
                        />
                        <button
                          type="button"
                          onClick={removeProfilePhoto}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Upload Photo</span>
                          </>
                        )}
                      </label>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                      Accepts JPEG, PNG, WebP. Max 5MB.
                    </p>
                  </div>
                </motion.div>

                {/* Guardian Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Guardian
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="guardianName" className="text-xs">
                        Guardian Name
                      </Label>
                      <input
                        id="guardianName"
                        type="text"
                        value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianRelationship" className="text-xs">
                        Relationship
                      </Label>
                      <Dropdown
                        options={[
                          { value: 'FATHER', label: 'Father' },
                          { value: 'MOTHER', label: 'Mother' },
                          { value: 'GUARDIAN', label: 'Guardian' },
                          { value: 'GRANDPARENT', label: 'Grandparent' },
                          { value: 'SIBLING', label: 'Sibling' },
                          { value: 'OTHER', label: 'Other' },
                        ]}
                        value={formData.guardianRelationship}
                        onChange={(val) => setFormData({ ...formData, guardianRelationship: val })}
                        placeholder="Select Relationship"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianPhone" className="text-xs">
                        Phone
                      </Label>
                      <input
                        id="guardianPhone"
                        type="tel"
                        value={formData.guardianPhone}
                        onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianEmail" className="text-xs">
                        Email
                      </Label>
                      <input
                        id="guardianEmail"
                        type="email"
                        value={formData.guardianEmail}
                        onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianOccupation" className="text-xs">
                        Occupation
                      </Label>
                      <input
                        id="guardianOccupation"
                        type="text"
                        value={formData.guardianOccupation}
                        onChange={(e) => setFormData({ ...formData, guardianOccupation: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Previous Education */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Previous Education
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="previousSchool" className="text-xs">
                        Previous School
                      </Label>
                      <input
                        id="previousSchool"
                        type="text"
                        value={formData.previousSchool}
                        onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="previousClass" className="text-xs">
                        Previous Class
                      </Label>
                      <input
                        id="previousClass"
                        type="text"
                        value={formData.previousClass}
                        onChange={(e) => setFormData({ ...formData, previousClass: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex flex-col gap-3">
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Create Student
                        </>
                      )}
                    </Button>
                    <Link href="/dashboard/students" className="w-full">
                      <Button type="button" variant="outline" className="w-full">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && createdStudentData && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>

              {/* Success Message */}
              <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Student Admitted Successfully!
              </h3>
              
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {createdStudentData.studentName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Admission No: {createdStudentData.admissionNumber}
                </p>
                {createdStudentData.receiptNumber && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Receipt: {createdStudentData.receiptNumber}
                  </p>
                )}
              </div>

              {/* Fee Summary if payment was collected */}
              {createdStudentData.receiptNumber && feeData && (
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Total Fee:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{feeData.totalAmount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {feeData.discountAmount > 0 && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -₹{feeData.discountAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {paymentData && (
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-dark-600">
                      <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                      <span className="font-bold text-primary">
                        ₹{paymentData.amountCollected?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {createdStudentData.receiptNumber && (
                  <Button
                    onClick={() => {
                      router.push(`/dashboard/finance/receipts/${createdStudentData.receiptNumber}`)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Print Receipt
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setShowSuccessModal(false)
                    router.push('/dashboard/students')
                  }}
                  className="flex-1"
                >
                  OK
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
