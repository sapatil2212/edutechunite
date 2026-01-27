'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  History,
  Send,
  Users
} from 'lucide-react'

interface Child {
  id: string
  fullName: string
}

interface LeaveRequest {
  id: string
  startDate: string
  endDate: string
  reason: string
  leaveType: string
  status: string
  createdAt: string
}

export default function ParentLeavePage() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: 'SICK'
  })

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch('/api/institution/parent/children')
        const result = await res.json()
        if (result.children?.length > 0) {
          setChildren(result.children)
          setSelectedChild(result.children[0].id)
        }
      } catch (error) {
        console.error('Error fetching children:', error)
      }
    }
    fetchChildren()
  }, [])

  useEffect(() => {
    if (selectedChild) {
      fetchRequests()
    }
  }, [selectedChild])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/institution/leave?studentId=${selectedChild}`)
      const data = await res.json()
      setRequests(data.leaveRequests || [])
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/institution/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          studentId: selectedChild
        })
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ startDate: '', endDate: '', reason: '', leaveType: 'SICK' })
        fetchRequests()
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success" className="font-bold">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="danger" className="font-bold">Rejected</Badge>
      default:
        return <Badge variant="warning" className="font-bold">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submit leave applications for your children</p>
        </div>

        <div className="flex items-center gap-4">
          {children.length > 1 && (
            <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    selectedChild === child.id
                      ? 'bg-white dark:bg-dark-700 text-green-700 dark:text-green-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {child.fullName.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl font-bold flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-soft"
          >
            {showForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Apply for Leave'}
          </Button>
        </div>
      </div>

      {!selectedChild ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Applied"
              value={requests.length.toString()}
              change="This academic year"
              trend="up"
              icon={FileText}
              color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Pending"
              value={requests.filter(r => r.status === 'PENDING').length.toString()}
              change="Awaiting response"
              trend="up"
              icon={Clock}
              color="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
            />
            <StatCard
              title="Approved"
              value={requests.filter(r => r.status === 'APPROVED').length.toString()}
              change="Successfully granted"
              trend="up"
              icon={CheckCircle2}
              color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Rejected"
              value={requests.filter(r => r.status === 'REJECTED').length.toString()}
              change="Denied requests"
              trend="down"
              icon={XCircle}
              color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {showForm && (
              <div className="lg:col-span-1 animate-in slide-in-from-left duration-300">
                <Card className="border-none shadow-soft h-fit">
                  <CardHeader className="border-b border-gray-50 dark:border-dark-800">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Send className="w-5 h-5 text-green-600" />
                      New Application
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Leave Type</Label>
                        <select
                          className="w-full h-10 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={formData.leaveType}
                          onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                        >
                          <option value="SICK">Sick Leave</option>
                          <option value="PERSONAL">Personal Leave</option>
                          <option value="EMERGENCY">Emergency Leave</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-gray-500">Start Date</Label>
                          <Input
                            type="date"
                            className="rounded-xl border-gray-200 dark:border-dark-700"
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-gray-500">End Date</Label>
                          <Input
                            type="date"
                            className="rounded-xl border-gray-200 dark:border-dark-700"
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Reason</Label>
                        <Textarea
                          className="rounded-xl border-gray-200 dark:border-dark-700 min-h-[100px]"
                          placeholder="Why is your child taking leave?"
                          value={formData.reason}
                          onChange={(e) => setFormData({...formData, reason: e.target.value})}
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full rounded-xl font-bold py-6 bg-green-600 hover:bg-green-700 shadow-soft"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <Card className="border-none shadow-soft overflow-hidden">
                <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <History className="w-5 h-5 text-green-600" />
                    Application History
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                    </div>
                  ) : requests.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No leave requests found for this child.</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-dark-900/50">
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                        {requests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-bold text-gray-900 dark:text-white text-sm">
                                {request.leaveType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {new Date(request.startDate).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">
                                  to {new Date(request.endDate).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                {request.reason}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {getStatusBadge(request.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
