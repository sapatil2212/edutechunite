'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  GraduationCap,
  MapPin,
  Users,
  FileText,
  Mail,
  Phone,
  Calendar,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  Eye,
  Download,
  Printer,
  Edit,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
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
  canPickup: boolean
  guardian: Guardian
}

interface EnrollmentHistory {
  id: string
  academicYear: { id: string; name: string }
  academicUnit: { id: string; name: string }
  rollNumber: string | null
  status: string
  enrollmentDate: string
  exitDate: string | null
}

interface Payment {
  id: string
  receiptNumber: string
  amount: number
  paymentMethod: string
  transactionId: string | null
  paidAt: string
  status: string
  remarks: string | null
}

interface StudentFee {
  id: string
  totalAmount: number
  discountAmount: number
  finalAmount: number
  paidAmount: number
  balanceAmount: number
  status: string
  payments: Payment[]
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
  createdAt: string
  academicYear: { id: string; name: string }
  academicUnit: { 
    id: string
    name: string
    parent?: { id: string; name: string } | null
  }
  guardians: StudentGuardian[]
  enrollmentHistory: EnrollmentHistory[]
}

export default function ViewStudentPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [studentFee, setStudentFee] = useState<StudentFee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchStudent()
    fetchStudentFee()
  }, [studentId])

  const fetchStudent = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/institution/students/${studentId}`)
      const data = await res.json()

      if (res.ok) {
        setStudent(data.student)
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

  const fetchStudentFee = async () => {
    try {
      const res = await fetch(`/api/institution/finance/student-fees?studentId=${studentId}`)
      const data = await res.json()

      if (res.ok && data.studentFees && data.studentFees.length > 0) {
        setStudentFee(data.studentFees[0])
      }
    } catch (err) {
      console.error('Error fetching student fee:', err)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/institution/students/${studentId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        router.push('/dashboard/students')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete student')
      }
    } catch (err) {
      console.error('Error deleting student:', err)
      setError('Failed to delete student')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            Active
          </span>
        )
      case 'INACTIVE':
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            Inactive
          </span>
        )
      case 'ALUMNI':
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
            Alumni
          </span>
        )
      case 'TRANSFERRED':
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
            Transferred
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE': return 'Male'
      case 'FEMALE': return 'Female'
      case 'OTHER': return 'Other'
      default: return gender
    }
  }

  const getBloodGroupLabel = (bloodGroup: string) => {
    return bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') || '-'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/students">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Student Details
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View complete student information
                </p>
              </div>
            </div>
            {student && (
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/students/${studentId}/edit`}>
                  <Button variant="outline">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          ) : student ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex items-start gap-6">
                    {student.profilePhoto ? (
                      <img
                        src={student.profilePhoto}
                        alt={student.fullName}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center">
                        <span className="text-primary font-bold text-3xl">
                          {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {student.fullName}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {student.admissionNumber}
                          </p>
                        </div>
                        {getStatusBadge(student.status)}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <GraduationCap className="w-4 h-4" />
                          {student.academicUnit?.parent?.name ? `${student.academicUnit.parent.name} - ` : ''}
                          {student.academicUnit?.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {student.academicYear?.name}
                        </div>
                        {student.rollNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FileText className="w-4 h-4" />
                            Roll: {student.rollNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Basic Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Personal Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(student.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gender</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getGenderLabel(student.gender)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Blood Group</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getBloodGroupLabel(student.bloodGroup || '')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nationality</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.nationality || '-'}
                      </p>
                    </div>
                    {student.stream && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stream</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.stream}
                        </p>
                      </div>
                    )}
                    {student.program && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Program</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.program}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Contact Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {student.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.phone}
                          </p>
                        </div>
                      </div>
                    )}
                    {student.emergencyContact && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Emergency Contact</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.emergencyContact}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {student.address && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {[student.address, student.city, student.state, student.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Enrollment History */}
                {student.enrollmentHistory && student.enrollmentHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Enrollment History
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {student.enrollmentHistory.map((enrollment, index) => (
                        <div
                          key={enrollment.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            index === 0
                              ? 'bg-primary/5 dark:bg-primary/10 border border-primary/20'
                              : 'bg-gray-50 dark:bg-dark-700'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {enrollment.academicUnit.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {enrollment.academicYear.name}
                              {enrollment.rollNumber && ` • Roll: ${enrollment.rollNumber}`}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              enrollment.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {enrollment.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Fee Payment History */}
                {studentFee && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Fee Payment History
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Total: {formatCurrency(studentFee.finalAmount)} • Paid: {formatCurrency(studentFee.paidAmount)}
                          </p>
                        </div>
                      </div>
                      <Link href={`/dashboard/students/${studentId}/fees`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>

                    {/* Fee Summary */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Fee</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                          {formatCurrency(studentFee.totalAmount)}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">Paid</p>
                        <p className="text-lg font-bold text-green-900 dark:text-green-300">
                          {formatCurrency(studentFee.paidAmount)}
                        </p>
                      </div>
                      <div className={`rounded-lg p-3 ${
                        studentFee.balanceAmount > 0 
                          ? 'bg-orange-50 dark:bg-orange-900/20' 
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}>
                        <p className={`text-xs mb-1 ${
                          studentFee.balanceAmount > 0 
                            ? 'text-orange-600 dark:text-orange-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>Balance</p>
                        <p className={`text-lg font-bold ${
                          studentFee.balanceAmount > 0 
                            ? 'text-orange-900 dark:text-orange-300' 
                            : 'text-gray-900 dark:text-gray-300'
                        }`}>
                          {formatCurrency(studentFee.balanceAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Payment List */}
                    {studentFee.payments && studentFee.payments.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                          Recent Payments
                        </p>
                        {studentFee.payments.slice(0, 3).map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatCurrency(payment.amount)}
                                </p>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium rounded">
                                  {payment.paymentMethod}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                <span>{formatDate(payment.paidAt)}</span>
                                <span>Receipt: {payment.receiptNumber}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/dashboard/finance/receipts/${payment.receiptNumber}`)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-dark-500 rounded-lg transition-colors"
                                title="View Receipt"
                              >
                                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-dark-500 rounded-lg transition-colors"
                                title="Print Receipt"
                              >
                                <Printer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/dashboard/finance/receipts/${payment.receiptNumber}`;
                                  link.target = '_blank';
                                  link.click();
                                }}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-dark-500 rounded-lg transition-colors"
                                title="Download Receipt"
                              >
                                <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {studentFee.payments.length > 3 && (
                          <Link href={`/dashboard/students/${studentId}/fees`}>
                            <p className="text-xs text-primary hover:underline text-center pt-2">
                              View all {studentFee.payments.length} payments →
                            </p>
                          </Link>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No payments recorded yet
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Guardians */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Guardians
                    </h3>
                  </div>

                  {student.guardians && student.guardians.length > 0 ? (
                    <div className="space-y-4">
                      {student.guardians.map((sg, index) => (
                        <div
                          key={sg.guardian.id}
                          className={`p-3 rounded-lg ${
                            sg.isPrimary
                              ? 'bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20'
                              : 'bg-gray-50 dark:bg-dark-700'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {sg.guardian.fullName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {sg.relationship?.toLowerCase() || sg.guardian.relationship?.toLowerCase()}
                              </p>
                            </div>
                            {sg.isPrimary && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {sg.guardian.phone}
                            </p>
                            {sg.guardian.email && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {sg.guardian.email}
                              </p>
                            )}
                            {sg.guardian.occupation && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {sg.guardian.occupation}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No guardians linked
                    </p>
                  )}
                </motion.div>

                {/* Previous Education */}
                {(student.previousSchool || student.previousClass) && (
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
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Previous Education
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {student.previousSchool && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">School</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.previousSchool}
                          </p>
                        </div>
                      )}
                      {student.previousClass && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Class</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.previousClass}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Meta Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-100 dark:bg-dark-700 rounded-xl p-4"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Added on {formatDate(student.createdAt)}
                  </p>
                </motion.div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                Delete Student?
              </h3>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                This will deactivate the student and remove them from the class. This action can be undone by reactivating the student.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setDeleteConfirm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
