'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  ArrowLeft,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  Filter,
  RefreshCw,
  Printer,
  FileBarChart,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ClassInfo {
  id: string
  name: string
  studentCount: number
}

interface AttendanceStats {
  totalStudents: number
  presentToday: number
  absentToday: number
  lateToday: number
  excusedToday: number
  averageAttendance: number
  monthlyTrend: number
}

interface StudentAttendance {
  id: string
  name: string
  rollNumber: string
  totalDays: number
  present: number
  absent: number
  late: number
  excused: number
  percentage: number
}

interface DailyData {
  date: string
  dayName: string
  present: number
  absent: number
  late: number
  total: number
}

// Simple SVG Pie Chart Component
const PieChart = ({ 
  data, 
  colors, 
  size = 200 
}: { 
  data: { label: string; value: number }[]
  colors: string[]
  size?: number 
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null
  
  let currentAngle = -90
  const radius = size / 2 - 10
  const center = size / 2

  const segments = data.map((d, i) => {
    const percentage = (d.value / total) * 100
    const angle = (d.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    return { path, color: colors[i % colors.length], label: d.label, value: d.value, percentage }
  })

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="transform -rotate-0">
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill={seg.color}
            className="transition-all duration-300 hover:opacity-80"
          />
        ))}
        {/* Center circle for donut effect */}
        <circle cx={center} cy={center} r={radius * 0.5} fill="white" className="dark:fill-gray-800" />
        <text 
          x={center} 
          y={center - 5} 
          textAnchor="middle" 
          className="text-2xl font-bold fill-gray-900 dark:fill-white"
        >
          {total}
        </text>
        <text 
          x={center} 
          y={center + 15} 
          textAnchor="middle" 
          className="text-xs fill-gray-500"
        >
          Total
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600 dark:text-gray-400">{seg.label}:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{seg.value}</span>
            <span className="text-gray-400">({seg.percentage.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Bar Chart Component
const BarChart = ({ data, maxValue }: { data: DailyData[]; maxValue: number }) => {
  return (
    <div className="space-y-3">
      {data.map((day, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-16 text-xs text-gray-500 dark:text-gray-400">{day.dayName}</div>
          <div className="flex-1 flex items-center gap-1 h-6">
            <div 
              className="h-full bg-green-500 rounded-l transition-all duration-500"
              style={{ width: `${(day.present / maxValue) * 100}%` }}
              title={`Present: ${day.present}`}
            />
            <div 
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${(day.absent / maxValue) * 100}%` }}
              title={`Absent: ${day.absent}`}
            />
            <div 
              className="h-full bg-yellow-500 rounded-r transition-all duration-500"
              style={{ width: `${(day.late / maxValue) * 100}%` }}
              title={`Late: ${day.late}`}
            />
          </div>
          <div className="w-12 text-xs text-right font-medium text-gray-700 dark:text-gray-300">
            {day.total > 0 ? Math.round((day.present / day.total) * 100) : 0}%
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AttendanceReportPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [studentData, setStudentData] = useState<StudentAttendance[]>([])
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [showExportMenu, setShowExportMenu] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [selectedClass, dateRange])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch classes
      const classesRes = await fetch('/api/institution/teachers/my-classes')
      const classesData = await classesRes.json()
      if (classesData.success) {
        const allClasses = [
          ...(classesData.data.classTeacherClasses || []),
          ...(classesData.data.subjectTeacherClasses || [])
        ]
        // Remove duplicates
        const uniqueClasses = allClasses.filter((cls: ClassInfo, idx: number, arr: ClassInfo[]) => 
          arr.findIndex(c => c.id === cls.id) === idx
        )
        setClasses(uniqueClasses)
      }

      // Fetch attendance report stats from real API
      const reportRes = await fetch(`/api/institution/teachers/attendance/report?classId=${selectedClass}&range=${dateRange}`)
      const reportData = await reportRes.json()
      
      if (reportData.success) {
        setStats(reportData.data.stats)
        setStudentData(reportData.data.students || [])
        setDailyData(reportData.data.dailyData || [])
      } else {
        // If no data or error, set empty state
        setStats({
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0,
          excusedToday: 0,
          averageAttendance: 0,
          monthlyTrend: 0,
        })
        setStudentData([])
        setDailyData([])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      // Set empty state on error
      setStats({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        excusedToday: 0,
        averageAttendance: 0,
        monthlyTrend: 0,
      })
      setStudentData([])
      setDailyData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = (format: 'pdf' | 'excel' | 'word') => {
    setShowExportMenu(false)
    
    // Generate export based on format
    if (format === 'excel') {
      exportToExcel()
    } else if (format === 'pdf') {
      exportToPDF()
    } else if (format === 'word') {
      exportToWord()
    }
  }

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Roll No', 'Student Name', 'Total Days', 'Present', 'Absent', 'Late', 'Excused', 'Percentage']
    const rows = studentData.map(s => [
      s.rollNumber,
      s.name,
      s.totalDays,
      s.present,
      s.absent,
      s.late,
      s.excused,
      `${s.percentage}%`
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('Attendance Report', 14, 22)
    
    // Add Metadata
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const date = new Date().toLocaleDateString()
    doc.text(`Generated on: ${date}`, 14, 30)
    
    // Summary Section
    doc.setFontSize(14)
    doc.setTextColor(60, 60, 60)
    doc.text('Summary', 14, 45)
    
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`Total Students: ${stats?.totalStudents || 0}`, 14, 52)
    doc.text(`Present Today: ${stats?.presentToday || 0}`, 14, 58)
    doc.text(`Absent Today: ${stats?.absentToday || 0}`, 14, 64)
    doc.text(`Average Attendance: ${stats?.averageAttendance || 0}%`, 14, 70)
    
    // Student Table
    const tableHeaders = [['Roll No', 'Student Name', 'Total Days', 'Present', 'Absent', 'Late', 'Percentage']]
    const tableData = studentData.map(s => [
      s.rollNumber,
      s.name,
      s.totalDays,
      s.present,
      s.absent,
      s.late,
      `${s.percentage}%`
    ])
    
    autoTable(doc, {
      startY: 80,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [229, 243, 60], textColor: [52, 54, 8], fontStyle: 'bold' }, // Using primary colors
      alternateRowStyles: { fillColor: [250, 252, 212] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
      }
    })
    
    doc.save(`attendance_report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportToWord = () => {
    // Create HTML content for Word
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head><title>Attendance Report</title></head>
      <body>
        <h1>Attendance Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <h2>Summary</h2>
        <p>Total Students: ${stats?.totalStudents}</p>
        <p>Average Attendance: ${stats?.averageAttendance}%</p>
        <h2>Student Details</h2>
        <table border="1" cellpadding="5">
          <tr><th>Roll No</th><th>Name</th><th>Present</th><th>Absent</th><th>Late</th><th>%</th></tr>
          ${studentData.map(s => `<tr><td>${s.rollNumber}</td><td>${s.name}</td><td>${s.present}</td><td>${s.absent}</td><td>${s.late}</td><td>${s.percentage}%</td></tr>`).join('')}
        </table>
      </body>
      </html>
    `
    
    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.doc`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const pieChartData = stats ? [
    { label: 'Present', value: stats.presentToday },
    { label: 'Absent', value: stats.absentToday },
    { label: 'Late', value: stats.lateToday },
    { label: 'Excused', value: stats.excusedToday },
  ] : []

  const pieChartColors = ['#22c55e', '#ef4444', '#eab308', '#3b82f6']

  return (
    <div ref={reportRef}>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/teacher"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Attendance Report
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive attendance analytics and insights
            </p>
          </div>
          
          {/* Export Button */}
          <div className="relative">
            <Button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="shadow-lg shadow-primary/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-500" />
                    Export as Excel
                  </button>
                  <button
                    onClick={() => handleExport('word')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <File className="w-4 h-4 text-blue-500" />
                    Export as Word
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-800 rounded-lg p-1">
          {(['week', 'month', 'quarter'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Students" 
            value={stats.totalStudents.toString()} 
            change="Across classes"
            trend="up"
            icon={Users}
            color="bg-primary/20 text-primary-700 dark:text-primary-400" 
          />
          <StatCard 
            title="Present Today" 
            value={stats.presentToday.toString()} 
            change="Attended"
            trend="up"
            icon={CheckCircle}
            color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" 
          />
          <StatCard 
            title="Absent Today" 
            value={stats.absentToday.toString()} 
            change="Not present"
            trend="down"
            icon={XCircle}
            color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" 
          />
          <StatCard 
            title="Avg. Attendance" 
            value={`${stats.averageAttendance}%`} 
            change={`${stats.monthlyTrend >= 0 ? '+' : ''}${stats.monthlyTrend}%`}
            trend={stats.monthlyTrend >= 0 ? 'up' : 'down'}
            icon={TrendingUp}
            color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart - Today's Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Today's Attendance Overview
          </h3>
          <PieChart data={pieChartData} colors={pieChartColors} size={180} />
        </Card>

        {/* Bar Chart - Weekly Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" />
            Weekly Attendance Trend
          </h3>
          <div className="mb-4 flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-500">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500" />
              <span className="text-gray-500">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-gray-500">Late</span>
            </div>
          </div>
          <BarChart data={dailyData} maxValue={Math.max(...dailyData.map(d => d.total))} />
        </Card>
      </div>

      {/* Student-wise Attendance Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Student-wise Attendance</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Individual attendance breakdown for the selected period</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-dark-800/50">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roll</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student Name</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Days</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="text-green-600">Present</span>
                </th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="text-red-600">Absent</span>
                </th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="text-yellow-600">Late</span>
                </th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendance %</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {studentData.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-800 text-xs font-bold text-gray-600 dark:text-gray-400">
                      {student.rollNumber}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-gray-900 dark:text-white">{student.name}</span>
                  </td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-gray-600 dark:text-gray-400">{student.totalDays}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
                      {student.present}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                      student.absent > 0 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                        : 'bg-gray-100 dark:bg-dark-800 text-gray-400'
                    }`}>
                      {student.absent}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                      student.late > 0 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' 
                        : 'bg-gray-100 dark:bg-dark-800 text-gray-400'
                    }`}>
                      {student.late}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-20 h-2 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            student.percentage >= 90 ? 'bg-green-500' :
                            student.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${student.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-10">
                        {student.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {student.percentage >= 90 ? (
                      <Badge variant="success">
                        Excellent
                      </Badge>
                    ) : student.percentage >= 75 ? (
                      <Badge variant="warning">
                        Good
                      </Badge>
                    ) : (
                      <Badge variant="danger">
                        Low
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-dark-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Showing {studentData.length} students</span>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 text-primary-700 dark:text-primary-400 font-bold hover:opacity-80 transition-opacity"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </div>
        </div>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #__next,
          #__next * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
