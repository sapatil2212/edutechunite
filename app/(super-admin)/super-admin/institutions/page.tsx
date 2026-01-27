'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Building2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  CheckCircle,
  X,
  Loader2,
  AlertTriangle,
  School,
  GraduationCap,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Shield,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

interface Institution {
  id: string
  schoolId: string
  name: string
  institutionType: string
  schoolType: string | null
  email: string
  phone: string
  city: string
  state: string
  district: string | null
  status: string
  isVerified: boolean
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
  admin: {
    id: string
    fullName: string
    email: string
    phone: string
    status: string
    emailVerified: boolean
    lastLoginAt: string | null
  } | null
  totalUsers: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_VERIFICATION', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'SCHOOL', label: 'School' },
  { value: 'INSTITUTE', label: 'Institute' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'COACHING', label: 'Coaching Center' },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
    case 'PENDING_VERIFICATION':
      return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30'
    case 'SUSPENDED':
      return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
    case 'INACTIVE':
      return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30'
    default:
      return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'SCHOOL':
      return School
    case 'COLLEGE':
      return GraduationCap
    case 'INSTITUTE':
      return Building2
    case 'COACHING':
      return BookOpen
    default:
      return Building2
  }
}

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  // Modal states
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusAction, setStatusAction] = useState<'suspend' | 'activate' | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchInstitutions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      })

      const response = await fetch(`/api/super-admin/institutions?${params}`)
      const data = await response.json()

      if (data.success) {
        setInstitutions(data.data.institutions)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch institutions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter, typeFilter])

  useEffect(() => {
    fetchInstitutions()
  }, [fetchInstitutions])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchInstitutions()
  }

  const handleStatusUpdate = async () => {
    if (!selectedInstitution || !statusAction) return

    setIsUpdating(true)
    try {
      const newStatus = statusAction === 'suspend' ? 'SUSPENDED' : 'ACTIVE'

      const response = await fetch(`/api/super-admin/institutions/${selectedInstitution.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason,
          notifyAdmin: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update the list
        setInstitutions(prev =>
          prev.map(inst =>
            inst.id === selectedInstitution.id
              ? { ...inst, status: newStatus }
              : inst
          )
        )
        setShowStatusModal(false)
        setStatusReason('')
        setSelectedInstitution(null)
        setStatusAction(null)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const openStatusModal = (institution: Institution, action: 'suspend' | 'activate') => {
    setSelectedInstitution(institution)
    setStatusAction(action)
    setShowStatusModal(true)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Institutions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all registered institutions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total: {pagination?.total || 0} institutions
          </div>
          <Link href="/super-admin/institutions/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Institution
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-slate-700/50 p-4 mb-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, ID..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by status"
            />
          </div>
          <div className="w-48">
            <Select
              options={typeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="Filter by type"
            />
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary-600 text-dark-900">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No institutions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/50">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((institution, index) => {
                    const TypeIcon = getTypeIcon(institution.institutionType)
                    return (
                      <motion.tr
                        key={institution.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-slate-700/30 hover:bg-gray-50 dark:hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center">
                              <TypeIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{institution.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{institution.schoolId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {institution.institutionType.charAt(0) + institution.institutionType.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {institution.admin ? (
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">{institution.admin.fullName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{institution.admin.email}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No admin</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{institution.city}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{institution.state}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(institution.status)}`}>
                            {institution.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{institution.totalUsers}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedInstitution(institution)
                                setShowDetailsModal(true)
                              }}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {institution.status === 'ACTIVE' ? (
                              <button
                                onClick={() => openStatusModal(institution, 'suspend')}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Suspend"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : institution.status === 'SUSPENDED' ? (
                              <button
                                onClick={() => openStatusModal(institution, 'activate')}
                                className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                title="Activate"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrev}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNext}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedInstitution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedInstitution.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedInstitution.schoolId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  {/* Institution Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Institution Details</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedInstitution.institutionType.charAt(0) + selectedInstitution.institutionType.slice(1).toLowerCase()}
                            {selectedInstitution.schoolType && ` (${selectedInstitution.schoolType})`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm text-gray-900 dark:text-white">{selectedInstitution.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm text-gray-900 dark:text-white">{selectedInstitution.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedInstitution.city}, {selectedInstitution.state}
                            {selectedInstitution.district && ` (${selectedInstitution.district})`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Registered On</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(selectedInstitution.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedInstitution.status)}`}>
                            {selectedInstitution.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin Details</h3>
                    
                    {selectedInstitution.admin ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="text-sm text-gray-900 dark:text-white">{selectedInstitution.admin.fullName}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm text-gray-900 dark:text-white">{selectedInstitution.admin.email}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs mt-1 ${
                              selectedInstitution.admin.emailVerified
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                            }`}>
                              {selectedInstitution.admin.emailVerified ? 'Verified' : 'Not Verified'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm text-gray-900 dark:text-white">{selectedInstitution.admin.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Last Login</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {selectedInstitution.admin.lastLoginAt
                                ? new Date(selectedInstitution.admin.lastLoginAt).toLocaleString('en-IN')
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No admin assigned</p>
                    )}

                    <div className="pt-4">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Statistics</h3>
                      <div className="bg-gray-50 dark:bg-slate-700/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">{selectedInstitution.totalUsers}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                {selectedInstitution.status === 'ACTIVE' ? (
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false)
                      openStatusModal(selectedInstitution, 'suspend')
                    }}
                    className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/30"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Suspend Institution
                  </Button>
                ) : selectedInstitution.status === 'SUSPENDED' ? (
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false)
                      openStatusModal(selectedInstitution, 'activate')
                    }}
                    className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 border border-emerald-200 dark:border-emerald-500/30"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate Institution
                  </Button>
                ) : null}
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  variant="ghost"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Change Modal */}
      <AnimatePresence>
        {showStatusModal && selectedInstitution && statusAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowStatusModal(false)
              setStatusReason('')
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  statusAction === 'suspend' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-emerald-100 dark:bg-emerald-500/20'
                }`}>
                  {statusAction === 'suspend' ? (
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                  {statusAction === 'suspend' ? 'Suspend Institution' : 'Activate Institution'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  {statusAction === 'suspend'
                    ? `Are you sure you want to suspend "${selectedInstitution.name}"? All users will lose access.`
                    : `Are you sure you want to activate "${selectedInstitution.name}"? All users will regain access.`}
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder={statusAction === 'suspend' ? 'Enter reason for suspension...' : 'Enter reason for activation...'}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowStatusModal(false)
                      setStatusReason('')
                    }}
                    variant="ghost"
                    className="flex-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating}
                    className={`flex-1 ${
                      statusAction === 'suspend'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : statusAction === 'suspend' ? (
                      'Suspend'
                    ) : (
                      'Activate'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

