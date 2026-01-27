'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  MessageSquare
} from 'lucide-react'

interface Child {
  id: string
  fullName: string
}

interface Homework {
  id: string
  title: string
  description: string
  dueDate: string
  subject: { name: string; code: string }
  status: string
  submission: {
    status: string
    submittedAt: string | null
    grade: string | null
    feedback: string | null
  } | null
}

export default function ParentHomeworkPage() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)

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
      fetchHomework()
    }
  }, [selectedChild])

  const fetchHomework = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/institution/homework?studentId=${selectedChild}`)
      const data = await res.json()
      setHomeworks(data.homeworks || [])
    } catch (error) {
      console.error('Error fetching homework:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (homework: Homework) => {
    const status = homework.submission?.status || 'PENDING'
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="primary" className="font-bold">Submitted</Badge>
      case 'EVALUATED':
        return <Badge variant="success" className="font-bold">Evaluated</Badge>
      default:
        const isOverdue = new Date(homework.dueDate) < new Date()
        return <Badge variant={isOverdue ? "danger" : "warning"} className="font-bold">
          {isOverdue ? 'Overdue' : 'Pending'}
        </Badge>
    }
  }

  const stats = {
    pending: homeworks.filter(h => !h.submission || h.submission.status === 'PENDING').length,
    submitted: homeworks.filter(h => h.submission?.status === 'SUBMITTED').length,
    evaluated: homeworks.filter(h => h.submission?.status === 'EVALUATED').length,
    overdue: homeworks.filter(h => (!h.submission || h.submission.status === 'PENDING') && new Date(h.dueDate) < new Date()).length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Homework & Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your child's learning progress and assignment status</p>
        </div>

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
      </div>

      {!selectedChild ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Pending Homework"
              value={stats.pending.toString()}
              change="Require attention"
              trend="up"
              icon={FileText}
              color="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
            />
            <StatCard
              title="Submitted"
              value={stats.submitted.toString()}
              change="Awaiting evaluation"
              trend="up"
              icon={Clock}
              color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Evaluated"
              value={stats.evaluated.toString()}
              change="Completed this month"
              trend="up"
              icon={CheckCircle2}
              color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Overdue Tasks"
              value={stats.overdue.toString()}
              change="Missing deadlines"
              trend="down"
              icon={AlertCircle}
              color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
                <CardTitle className="text-lg font-bold">Assignment List</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                  </div>
                ) : homeworks.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No homework assignments found for this child.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-dark-900/50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assignment</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                      {homeworks.map((hw) => (
                        <tr key={hw.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 font-bold text-[10px]">
                                {hw.subject.code}
                              </div>
                              <span className="font-bold text-gray-900 dark:text-white text-sm">{hw.subject.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 dark:text-white text-sm">{hw.title}</span>
                              <span className="text-xs text-gray-500 line-clamp-1">{hw.description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {new Date(hw.dueDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getStatusBadge(hw)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {hw.submission?.grade ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="primary" className="font-black text-sm px-3">{hw.submission.grade}</Badge>
                                {hw.submission.feedback && (
                                  <div className="group relative">
                                    <MessageSquare className="w-4 h-4 text-gray-400 cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                      {hw.submission.feedback}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium italic">Pending evaluation</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
