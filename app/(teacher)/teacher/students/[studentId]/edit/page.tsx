'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  MapPin,
  Upload,
  X,
  Camera,
  Save,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dropdown } from '@/components/ui/dropdown'

interface StudentData {
  id: string
  admissionNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  fullName: string
  email: string | null
  phone: string | null
  emergencyContact: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  bloodGroup: string | null
  rollNumber: string | null
  profilePhoto: string | null
  academicYear: { id: string; name: string }
  academicUnit: { id: string; name: string; parent?: { id: string; name: string } | null }
}

export default function TeacherEditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params?.studentId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bloodGroup: '',
    rollNumber: '',
    profilePhoto: '',
  })

  const [originalData, setOriginalData] = useState<StudentData | null>(null)

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
        const student = data.data
        setOriginalData(student)
        setFormData({
          firstName: student.firstName || '',
          middleName: student.middleName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          phone: student.phone || '',
          emergencyContact: student.emergencyContact || '',
          address: student.address || '',
          city: student.city || '',
          state: student.state || '',
          pincode: student.pincode || '',
          bloodGroup: student.bloodGroup || '',
          rollNumber: student.rollNumber || '',
          profilePhoto: student.profilePhoto || '',
        })
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
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'students')

      const res = await fetch('/api/institution/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setFormData(prev => ({ ...prev, profilePhoto: data.url }))
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
    setFormData(prev => ({ ...prev, profilePhoto: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Only send fields that have changed
      const changedFields: Record<string, any> = {}
      
      if (formData.firstName !== originalData?.firstName) changedFields.firstName = formData.firstName
      if (formData.middleName !== (originalData?.middleName || '')) changedFields.middleName = formData.middleName || null
      if (formData.lastName !== originalData?.lastName) changedFields.lastName = formData.lastName
      if (formData.email !== (originalData?.email || '')) changedFields.email = formData.email || null
      if (formData.phone !== (originalData?.phone || '')) changedFields.phone = formData.phone || null
      if (formData.emergencyContact !== (originalData?.emergencyContact || '')) changedFields.emergencyContact = formData.emergencyContact || null
      if (formData.address !== (originalData?.address || '')) changedFields.address = formData.address || null
      if (formData.city !== (originalData?.city || '')) changedFields.city = formData.city || null
      if (formData.state !== (originalData?.state || '')) changedFields.state = formData.state || null
      if (formData.pincode !== (originalData?.pincode || '')) changedFields.pincode = formData.pincode || null
      if (formData.bloodGroup !== (originalData?.bloodGroup || '')) changedFields.bloodGroup = formData.bloodGroup || null
      if (formData.rollNumber !== (originalData?.rollNumber || '')) changedFields.rollNumber = formData.rollNumber || null
      if (formData.profilePhoto !== (originalData?.profilePhoto || '')) changedFields.profilePhoto = formData.profilePhoto || null

      if (Object.keys(changedFields).length === 0) {
        setSuccess('No changes to save')
        setIsSubmitting(false)
        return
      }

      const res = await fetch(`/api/institution/teachers/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedFields),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('Student profile updated successfully')
        // Update original data to reflect changes
        setOriginalData(prev => prev ? { ...prev, ...changedFields } : null)
        
        // Redirect back to profile after short delay
        setTimeout(() => {
          router.push(`/teacher/students/${studentId}`)
        }, 1500)
      } else {
        setError(data.error || 'Failed to update student')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update student')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!originalData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Student not found
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
      <div className="flex flex-col gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-700 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Student Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Update personal and contact details for {originalData.fullName}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Error Message */}
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

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
          >
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-none shadow-soft">
              <CardHeader className="border-b border-gray-100 dark:border-dark-800">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary-700" />
                  </div>
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                  />
                  <Input
                    label="Middle Name"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    placeholder="Enter middle name"
                  />
                  <Input
                    label="Last Name"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                  />
                  <div>
                    <Label className="text-sm font-medium">Blood Group</Label>
                    <Dropdown
                      options={[
                        { value: '', label: 'Select Blood Group' },
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
                    />
                  </div>
                  <Input
                    label="Roll Number"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g., 01, 02, A-001"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-none shadow-soft">
              <CardHeader className="border-b border-gray-100 dark:border-dark-800">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@email.com"
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                  <Input
                    label="Emergency Contact"
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Parent/Guardian contact"
                  />
                  <div className="sm:col-span-2">
                    <Label className="text-sm font-medium">Residential Address</Label>
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      placeholder="Enter full address"
                      className="w-full px-4 py-3 text-base bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>
                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                  <Input
                    label="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                  <Input
                    label="Pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="Pincode"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Profile Photo */}
            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-dark-800">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                    <Camera className="w-5 h-5 text-pink-600" />
                  </div>
                  Profile Photo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  {formData.profilePhoto ? (
                    <div className="relative group">
                      <img
                        src={formData.profilePhoto}
                        alt="Profile preview"
                        className="w-40 h-40 rounded-2xl object-cover border-4 border-white dark:border-dark-800 shadow-soft"
                      />
                      <button
                        type="button"
                        onClick={removeProfilePhoto}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-40 h-40 border-2 border-dashed border-gray-300 dark:border-dark-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      ) : (
                        <>
                          <div className="p-3 rounded-full bg-gray-50 dark:bg-dark-800 mb-3">
                            <Upload className="w-6 h-6 text-gray-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Upload Photo</span>
                        </>
                      )}
                    </label>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center max-w-[200px]">
                    JPG, PNG or WebP. Max 5MB.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Class Info (Read Only) */}
            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/50">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Academic Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Admission No.</span>
                    <span className="font-bold text-gray-900 dark:text-white px-2 py-1 rounded bg-gray-100 dark:bg-dark-800">
                      {originalData.admissionNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-start text-sm pt-4 border-t border-gray-50 dark:border-dark-800">
                    <span className="text-gray-500">Class/Section</span>
                    <span className="font-bold text-gray-900 dark:text-white text-right">
                      {originalData.academicUnit.parent 
                        ? `${originalData.academicUnit.parent.name} - ${originalData.academicUnit.name}`
                        : originalData.academicUnit.name
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-50 dark:border-dark-800">
                    <span className="text-gray-500">Academic Year</span>
                    <span className="font-bold text-gray-900 dark:text-white">{originalData.academicYear.name}</span>
                  </div>
                </div>
                <div className="mt-6 p-3 bg-primary/10 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-primary-700 shrink-0" />
                  <p className="text-[11px] leading-relaxed text-primary-900 dark:text-primary-100/70 font-medium">
                    Academic details are locked. Please contact the institution administrator for any corrections to class or enrollment year.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-none shadow-soft">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Update Profile
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="w-full h-12 text-gray-500 font-medium hover:bg-gray-50 dark:hover:bg-dark-800"
                  >
                    Discard Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}
