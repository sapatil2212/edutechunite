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

interface ExamResult {
  exam: {
    id: string
    name: string
    examType: string
    startDate: string
    endDate: string
    showRank: boolean
    showPercentage: boolean
    showGrade: boolean
  }
  student: {
    fullName: string
    admissionNumber: string
    rollNumber: string
    academicUnit: { name: string }
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

export default function ResultsPage() {
  const { data: session } = useSession()
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch('/api/institution/results')
        const data = await res.json()
        setResults(data.results || [])
        if (data.results?.length > 0) {
          setSelectedExam(data.results[0].exam.id)
        }
      } catch (error) {
        console.error('Error fetching results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  const selectedResult = results.find(r => r.exam.id === selectedExam)

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-gray-500'
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400'
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400'
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400'
    if (grade.startsWith('D')) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exam Results</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your performance and academic achievements</p>
        </div>
      </div>

      {results.length === 0 ? (
        <Card className="border-none shadow-soft p-12 text-center">
          <PieChart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Results Available</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Your exam results will appear here once they are published.
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
                    ? 'bg-white dark:bg-dark-700 text-primary-700 dark:text-primary-400 shadow-soft' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                {result.exam.name}
              </button>
            ))}
          </div>

          {selectedResult && (
            <>
              {/* Overall Summary Stats */}
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

              {/* Subject-wise Results */}
              <Card className="border-none shadow-soft overflow-hidden">
                <CardHeader className="border-b border-gray-100 dark:border-dark-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                      Subject-wise Breakdown
                    </CardTitle>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-xl text-sm font-bold hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all">
                      <Download className="w-4 h-4" />
                      Report Card
                    </button>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-dark-900/50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Max Marks</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Obtained</th>
                        {selectedResult.exam.showPercentage && (
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Percentage</th>
                        )}
                        {selectedResult.exam.showGrade && (
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                        )}
                        {selectedResult.exam.showRank && (
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                      {selectedResult.subjects.map((subject, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900 dark:text-white">{subject.subject.name}</div>
                            <div className="text-xs text-gray-500 font-medium">{subject.subject.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-white">
                            {subject.maxMarks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {subject.isAbsent ? (
                              <Badge variant="danger">Absent</Badge>
                            ) : (
                              <span className="font-bold text-primary-600 dark:text-primary-400">
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
                                }>
                                  {subject.grade}
                                </Badge>
                              ) : '-'}
                            </td>
                          )}
                          {selectedResult.exam.showRank && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm font-bold text-gray-700 dark:text-gray-300">
                                {subject.classRank || '-'}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium italic">
                            {subject.remarks || 'No remarks'}
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
