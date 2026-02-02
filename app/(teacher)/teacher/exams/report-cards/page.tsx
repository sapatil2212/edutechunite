'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Download, Eye, Loader2, AlertCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportCard {
  id: string
  studentName: string
  admissionNumber: string
  academicUnit: {
    name: string
    parent?: {
      name: string
    }
  }
  examName: string
  totalMarks: number
  obtainedMarks: number
  percentage: number
  grade: string
  status: 'GENERATED' | 'PENDING'
}

export default function TeacherReportCardsPage() {
  const [loading, setLoading] = useState(true)
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchReportCards()
  }, [])

  const fetchReportCards = async () => {
    try {
      setLoading(true)
      setError(null)
      // TODO: Implement actual API call
      // const response = await fetch('/api/teacher/exams/report-cards')
      // const data = await response.json()
      // setReportCards(data.reportCards || [])
      setReportCards([])
    } catch (error) {
      console.error('Error fetching report cards:', error)
      setError('Failed to load report cards')
    } finally {
      setLoading(false)
    }
  }

  const filteredReportCards = reportCards.filter(card =>
    card.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Report Cards
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View and download student report cards for your classes
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {filteredReportCards.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No report cards found matching your search' : 'No report cards available'}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {filteredReportCards.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {card.studentName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {card.admissionNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {card.academicUnit.parent?.name ? `${card.academicUnit.parent.name} - ` : ''}
                          {card.academicUnit.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {card.examName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {card.obtainedMarks}/{card.totalMarks}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {card.percentage.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            {card.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            card.status === 'GENERATED'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {card.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" disabled={card.status !== 'GENERATED'}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
