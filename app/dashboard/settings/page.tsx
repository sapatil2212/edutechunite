'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  Briefcase,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Hash,
  School,
  Pencil,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { EditInstitutionModal } from '@/components/dashboard/edit-institution-modal'
import { Button } from '@/components/ui/button'

interface InstitutionData {
  institution: {
    id: string
    schoolId: string
    name: string
    institutionType: string
    schoolType: string | null
    address: string
    city: string
    state: string
    district: string | null
    pincode: string | null
    email: string
    phone: string
    website: string | null
    logo: string | null
    status: string
    isVerified: boolean
    verifiedAt: string | null
    maxStudents: number
    maxTeachers: number
    maxStaff: number
    createdAt: string
    updatedAt: string
  }
  admin: {
    id: string
    fullName: string
    email: string
    phone: string
    emailVerified: boolean
    lastLoginAt: string | null
    createdAt: string
  } | null
  stats: {
    totalUsers: number
    admins: number
    teachers: number
    students: number
    staff: number
  }
  currentUser: {
    id: string
    fullName: string
    email: string
    role: string
  }
}

const getInstitutionTypeLabel = (type: string) => {
  switch (type) {
    case 'SCHOOL': return 'School'
    case 'INSTITUTE': return 'Institute'
    case 'COLLEGE': return 'College'
    case 'COACHING': return 'Coaching Center'
    default: return type
  }
}

const getSchoolTypeLabel = (type: string | null) => {
  if (!type) return null
  switch (type) {
    case 'PRESCHOOL': return 'Preschool / Early Learning'
    case 'PRIMARY': return 'Primary School'
    case 'MIDDLE': return 'Middle School'
    case 'SECONDARY': return 'Secondary School'
    case 'SENIOR_SECONDARY': return 'Senior Secondary School'
    case 'INTEGRATED': return 'Integrated School (K-12)'
    default: return type
  }
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircle2 }
    case 'PENDING_VERIFICATION':
      return { label: 'Pending Verification', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400', icon: Clock }
    case 'SUSPENDED':
      return { label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: AlertCircle }
    case 'INACTIVE':
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400', icon: AlertCircle }
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatState = (state: string) => {
  return state.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export default function SettingsPage() {
  const [data, setData] = useState<InstitutionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/institution/profile')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.message || 'Failed to load institution details')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load institution details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading institution details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">Error Loading Data</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const { institution, admin, stats } = data
  const statusConfig = getStatusConfig(institution.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage your institution details
            </p>
          </div>

          {/* Institution Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Logo/Avatar */}
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {institution.logo ? (
                  <img src={institution.logo} alt={institution.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Building2 className="w-8 h-8 text-primary" />
                )}
              </div>

              {/* Institution Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {institution.name}
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    {institution.schoolId}
                  </span>
                  <span className="flex items-center gap-1">
                    <School className="w-3.5 h-3.5" />
                    {getInstitutionTypeLabel(institution.institutionType)}
                  </span>
                  {institution.schoolType && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {getSchoolTypeLabel(institution.schoolType)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {institution.isVerified && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Verified</span>
                  </div>
                )}
                {data.currentUser.role === 'SCHOOL_ADMIN' && (
                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Institution Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{institution.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{institution.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Website</p>
                    {institution.website ? (
                      <a href={institution.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                        {institution.website}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">Not provided</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Address Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Address
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full Address</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{institution.address}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">City</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{institution.city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">State</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatState(institution.state)}</p>
                    </div>
                    {institution.district && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">District</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatState(institution.district)}</p>
                      </div>
                    )}
                    {institution.pincode && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pincode</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{institution.pincode}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Admin Details */}
              {admin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Administrator Details
                  </h3>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-sm">
                        {admin.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Full Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{admin.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{admin.email}</p>
                          {admin.emailVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{admin.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Last Login</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Registration Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Registration Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Registered On</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(institution.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(institution.updatedAt)}</p>
                  </div>
                  {institution.verifiedAt && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Verified On</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(institution.verifiedAt)}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Stats & Limits */}
            <div className="space-y-6">
              {/* User Statistics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  User Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Total Users</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Admins</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.admins}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Teachers</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.teachers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Students</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.students}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-500/20 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Staff</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.staff}</span>
                  </div>
                </div>
              </motion.div>

              {/* Subscription Limits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Subscription Limits
                </h3>
                <div className="space-y-4">
                  {/* Students Limit */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Students</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {stats.students} / {institution.maxStudents}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((stats.students / institution.maxStudents) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Teachers Limit */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Teachers</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {stats.teachers} / {institution.maxTeachers}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min((stats.teachers / institution.maxTeachers) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Staff Limit */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Staff</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {stats.staff} / {institution.maxStaff}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${Math.min((stats.staff / institution.maxStaff) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Institution Modal */}
      <EditInstitutionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        institution={institution ? {
          id: institution.id,
          name: institution.name,
          email: institution.email,
          address: institution.address,
          city: institution.city,
          state: institution.state,
          district: institution.district,
          pincode: institution.pincode,
          phone: institution.phone,
          website: institution.website,
          logo: institution.logo,
        } : null}
        onSuccess={() => {
          fetchProfile()
        }}
      />
    </div>
  )
}

