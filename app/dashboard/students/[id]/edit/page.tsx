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
  Save,
  Camera,
  Upload,
  X,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dropdown } from '@/components/ui/dropdown'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'

interface Guardian {
  id: string
  fullName: string
  relationship: string
  email: string | null
  phone: string
  occupation: string | null
}

interface StudentGuardian {
  relationship: string
  isPrimary: boolean
  guardian: Guardian
}

interface Student {
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
  rollNumber: string | null
  status: string
  stream: string | null
  program: string | null
  previousSchool: string | null
  previousClass: string | null
  academicYear: { id: string; name: string }
  academicUnit: { 
    id: string
    name: string
    parent?: { id: string; name: string } | null
  }
  guardians: StudentGuardian[]
}

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    nationality: '',
    email: '',
    phone: '',
    emergencyContact: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    rollNumber: '',
    status: '',
    stream: '',
    program: '',
    previousSchool: '',
    previousClass: '',
  })

  useEffect(() => {
    fetchStudent()
  }, [studentId])

  const fetchStudent = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/institution/students/${studentId}`)
      const data = await res.json()

      if (res.ok && data.student) {
        setStudent(data.student)
        setProfilePhoto(data.student.profilePhoto || null)
        setFormData({
          firstName: data.student.firstName || '',
          middleName: data.student.middleName || '',
          lastName: data.student.lastName || '',
          dateOfBirth: data.student.dateOfBirth ? data.student.dateOfBirth.split('T')[0] : '',
          gender: data.student.gender || '',
          bloodGroup: data.student.bloodGroup || '',
          nationality: data.student.nationality || '',
          email: data.student.email || '',
          phone: data.student.phone || '',
          emergencyContact: data.student.emergencyContact || '',
          address: data.student.address || '',
          city: data.student.city || '',
          state: data.student.state || '',
          pincode: data.student.pincode || '',
          rollNumber: data.student.rollNumber || '',
          status: data.student.status || '',
          stream: data.student.stream || '',
          program: data.student.program || '',
          previousSchool: data.student.previousSchool || '',
          previousClass: data.student.previousClass || '',
        })
      } else {
        setError(data.error || 'Failed to fetch student')
      }
    } catch (err) {
      console.error('Error fetching student:', err)
      setError('Failed to fetch student')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'students')

      const res = await fetch('/api/institution/upload', {
        method: 'POST',
        body: formDataUpload,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const payload = {
        firstName: formData.firstName,
        middleName: formData.middleName || null,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || null,
        nationality: formData.nationality || null,
        email: formData.email || null,
        phone: formData.phone || null,
        emergencyContact: formData.emergencyContact || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        profilePhoto: profilePhoto,
        rollNumber: formData.rollNumber || null,
        status: formData.status,
        stream: formData.stream || null,
        program: formData.program || null,
        previousSchool: formData.previousSchool || null,
        previousClass: formData.previousClass || null,
      }

      const res = await fetch(`/api/institution/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/dashboard/students/${studentId}`)
      } else {
        setError(data.error || 'Failed to update student')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update student')
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
            <Link href={`/dashboard/students/${studentId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Edit Student
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update student information
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error && !student ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          ) : student ? (
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

              {/* Info Banner */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {student.admissionNumber}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {student.academicUnit?.parent?.name ? `${student.academicUnit.parent.name} - ` : ''}
                      {student.academicUnit?.name} • {student.academicYear?.name}
                    </p>
                  </div>
                </div>
              </div>

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
                        <Label htmlFor="firstName" required className="text-xs">
                          First Name
                        </Label>
                        <input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                          required
                        />
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
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth" required className="text-xs">
                          Date of Birth
                        </Label>
                        <input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                          required
                        />
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
                          onChange={(val) => setFormData({ ...formData, gender: val })}
                          placeholder="Select Gender"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bloodGroup" className="text-xs">
                          Blood Group
                        </Label>
                        <Dropdown
                          options={[
                            { value: '', label: 'Not Specified' },
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
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Contact Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
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
                    transition={{ delay: 0.15 }}
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

                  {/* Status */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-emerald-500" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Status
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="status" required className="text-xs">
                          Student Status
                        </Label>
                        <Dropdown
                          options={[
                            { value: 'ACTIVE', label: 'Active' },
                            { value: 'INACTIVE', label: 'Inactive' },
                            { value: 'ALUMNI', label: 'Alumni' },
                            { value: 'TRANSFERRED', label: 'Transferred' },
                          ]}
                          value={formData.status}
                          onChange={(val) => setFormData({ ...formData, status: val })}
                          placeholder="Select Status"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stream" className="text-xs">
                          Stream
                        </Label>
                        <input
                          id="stream"
                          type="text"
                          value={formData.stream}
                          onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                          placeholder="e.g., Science, Commerce"
                        />
                      </div>
                      <div>
                        <Label htmlFor="program" className="text-xs">
                          Program
                        </Label>
                        <input
                          id="program"
                          type="text"
                          value={formData.program}
                          onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg"
                          placeholder="e.g., B.Tech, MBA"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Previous Education */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
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
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                  >
                    <div className="flex flex-col gap-3">
                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Link href={`/dashboard/students/${studentId}`} className="w-full">
                        <Button type="button" variant="outline" className="w-full">
                          Cancel
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      </main>
    </div>
  )
}
