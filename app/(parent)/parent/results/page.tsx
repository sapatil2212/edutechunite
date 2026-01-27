'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  Trophy, 
  Target, 
  Award, 
  TrendingUp, 
  Download, 
  FileText,
  Calendar,
  BookOpen,
  PieChart
} from 'lucide-react'

interface Child {
  id: string
  fullName: string
}

interface ExamResult {
  exam: {
    id: string
    name: string
    examType: string
    startDate: string
    showRank: boolean
    showPercentage: boolean
    showGrade: boolean
  }
  subjects: Array<{
    subject: { name: string; code: string }
    maxMarks: number
    marksObtained: number | null
    percentage: number | null
    grade: string | null
    classRank: number | null
    isAbsent: boolean
    remarks: string | null
  }>
  totalMarks: number
  totalMaxMarks: number
  overallPercentage: string
}

export default function ParentResultsPage() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState<string | null>(null)

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
      fetchResults()
    }
  }, [selectedChild])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/institution/results?studentId=${selectedChild}`)
      const data = await res.json()
      setResults(data.results || [])
      if (data.results?.length > 0) {
        setSelectedExam(data.results[0].exam.id)
      } else {
        setSelectedExam(null)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedResult = results.find(r => r.exam.id === selectedExam)

  const getOverallGrade = (percentage: string) => {
    const pct = parseFloat(percentage)
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B+'
    if (pct >= 60) return 'B'
    if (pct >= 50) return 'C'
    if (pct >= 33) return 'D'
    return 'F'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Examination Results</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comprehensive view of your child's academic performance</p>
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
      ) : results.length === 0 && !loading ? (
        <Card className="border-none shadow-soft p-12 text-center">
          <PieChart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Results Available</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Exam results for {children.find(c => c.id === selectedChild)?.fullName} are not yet published.
          </p>
        </Card>
      ) : (
        <>
          {/* Exam Selector */}
          <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700 w-fit overflow-x-auto max-w-full">
            {results.map((result) => (
              <button
                key={result.exam.id}
                onClick={() => setSelectedExam(result.exam.id)}
                className={`
                  px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
                  ${selectedExam === result.exam.id 
                    ? 'bg-white dark:bg-dark-700 text-green-700 dark:text-green-400 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                {result.exam.name}
              </button>
            ))}
          </div>

          {selectedResult && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Aggregate Score"
                  value={`${selectedResult.totalMarks}/${selectedResult.totalMaxMarks}`}
                  change="Total points"
                  trend="up"
                  icon={Target}
                  color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                />
                <StatCard
                  title="Overall Percentage"
                  value={`${selectedResult.overallPercentage}%`}
                  change="Of total possible"
                  trend={parseFloat(selectedResult.overallPercentage) >= 60 ? 'up' : 'down'}
                  icon={TrendingUp}
                  color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                />
                <StatCard
                  title="Final Grade"
                  value={getOverallGrade(selectedResult.overallPercentage)}
                  change="Based on performance"
                  trend="up"
                  icon={Award}
                  color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                />
                <StatCard
                  title="Exam Date"
                  value={new Date(selectedResult.exam.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  change="Examination period"
                  trend="up"
                  icon={Calendar}
                  color="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                />
              </div>

              <Card className="border-none shadow-soft overflow-hidden">
                <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    Detailed Performance Breakdown
                  </CardTitle>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/30 transition-all shadow-sm">
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-dark-900/50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Max Marks</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Obtained</th>
                        {selectedResult.exam.showPercentage && (
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Percentage</th>
                        )}
                        {selectedResult.exam.showGrade && (
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                      {selectedResult.subjects.map((subject, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900 dark:text-white text-sm">{subject.subject.name}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase">{subject.subject.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-white">
                            {subject.maxMarks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {subject.isAbsent ? (
                              <Badge variant="danger" className="font-bold">Absent</Badge>
                            ) : (
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {subject.marksObtained ?? '-'}
                              </span>
                            )}
                          </td>
                          {selectedResult.exam.showPercentage && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {subject.percentage ? `${subject.percentage.toFixed(1)}%` : '-'}
                              </span>
                            </td>
                          )}
                          {selectedResult.exam.showGrade && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {subject.grade ? (
                                <Badge variant={
                                  subject.grade.startsWith('A') ? 'success' :
                                  subject.grade.startsWith('B') ? 'primary' :
                                  subject.grade.startsWith('C') ? 'warning' : 'danger'
                                } className="font-bold">
                                  {subject.grade}
                                </Badge>
                              ) : '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-medium italic">
                            {subject.remarks || 'Excellent progress'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
