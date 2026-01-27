'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Loader2,
  AlertCircle,
  Calendar,
  Printer,
  Download,
  Users,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dropdown } from '@/components/ui/dropdown'

interface AcademicYear {
  id: string
  name: string
  isCurrent: boolean
}

interface AcademicUnit {
  id: string
  name: string
  parent?: { id: string; name: string } | null
  children?: { id: string; name: string }[]
}

interface PeriodTiming {
  periodNumber: number
  name: string
  startTime: string
  endTime: string
  isBreak: boolean
}

interface TimetableSlot {
  id: string
  dayOfWeek: string
  periodNumber: number
  slotType: string
  subject: {
    name: string
    code: string
    color: string | null
  } | null
  teacher: {
    name: string
  } | null
  room: string | null
}

interface TimetableData {
  id: string
  version: number
  publishedAt: string
  workingDays: string[]
  periodTimings: PeriodTiming[]
  slots: TimetableSlot[]
}

const getDayLabel = (day: string) => day.charAt(0) + day.slice(1).toLowerCase()

export default function TimetableViewPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([])
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [timetable, setTimetable] = useState<TimetableData | null>(null)
  const [unitInfo, setUnitInfo] = useState<{ name: string; parentName: string | null; academicYear: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTimetableLoading, setIsTimetableLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedYearId) {
      fetchAcademicUnits()
    }
  }, [selectedYearId])

  useEffect(() => {
    if (selectedUnitId) {
      fetchTimetable()
    }
  }, [selectedUnitId])

  const fetchInitialData = async () => {
    try {
      const response = await fetch('/api/institution/academic-years')
      const data = await response.json()

      if (data.success) {
        setAcademicYears(data.data || [])
        const currentYear = data.data?.find((y: AcademicYear) => y.isCurrent)
        if (currentYear) setSelectedYearId(currentYear.id)
        else if (data.data?.length > 0) setSelectedYearId(data.data[0].id)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAcademicUnits = async () => {
    try {
      const response = await fetch(
        `/api/institution/academic-units?academicYearId=${selectedYearId}&parentId=null&includeChildren=true`
      )
      const data = await response.json()
      if (data.success) {
        setAcademicUnits(data.data || [])
      }
    } catch (err) {
      console.error('Fetch units error:', err)
    }
  }

  const fetchTimetable = async () => {
    setIsTimetableLoading(true)
    setTimetable(null)
    setError('')

    try {
      const response = await fetch(`/api/institution/timetable/class/${selectedUnitId}`)
      const data = await response.json()

      if (data.success) {
        setUnitInfo(data.data.academicUnit)
        setTimetable(data.data.timetable)
      } else {
        setError(data.message || 'Failed to load timetable')
      }
    } catch (err) {
      console.error('Fetch timetable error:', err)
      setError('Failed to load timetable')
    } finally {
      setIsTimetableLoading(false)
    }
  }

  const getSlot = (day: string, periodNumber: number): TimetableSlot | undefined => {
    if (!timetable?.slots) return undefined
    return timetable.slots.find((s) => s.dayOfWeek === day && s.periodNumber === periodNumber)
  }

  const handlePrint = () => {
    window.print()
  }

  // Get unit options with parent names
  const unitOptions = academicUnits.flatMap((unit) => {
    if (unit.children && unit.children.length > 0) {
      return unit.children.map((section) => ({
        value: section.id,
        label: `${unit.name} - ${section.name}`,
      }))
    }
    return [{ value: unit.id, label: unit.name }]
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Class Timetable
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View the weekly schedule for any class
              </p>
            </div>
            {timetable && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                Print
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="w-48">
              <Label className="text-xs mb-1 block">Academic Year</Label>
              <Dropdown
                options={academicYears.map((y) => ({ value: y.id, label: y.name }))}
                value={selectedYearId}
                onChange={setSelectedYearId}
                placeholder="Select Year"
              />
            </div>
            <div className="w-64">
              <Label className="text-xs mb-1 block">Class / Section</Label>
              <Dropdown
                options={unitOptions}
                value={selectedUnitId}
                onChange={setSelectedUnitId}
                placeholder="Select Class"
                searchable
              />
            </div>
          </div>

          {/* Content */}
          {!selectedUnitId ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select a Class
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Choose an academic year and class to view the timetable.
              </p>
            </motion.div>
          ) : isTimetableLoading ? (
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
          ) : !timetable ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center"
            >
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Timetable Published
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                The timetable for this class has not been published yet. Please check back later.
              </p>
            </motion.div>
          ) : (
            <div className="print:m-0">
              {/* Class Info */}
              {unitInfo && (
                <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 mb-4 print:rounded-none print:border-0 print:shadow-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {unitInfo.parentName
                          ? `${unitInfo.parentName} - ${unitInfo.name}`
                          : unitInfo.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {unitInfo.academicYear}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400 print:hidden">
                      <p>Version {timetable.version}</p>
                      <p>Published: {new Date(timetable.publishedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timetable Grid */}
              <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden print:rounded-none print:border-0 print:shadow-none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-dark-700">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-28 bg-gray-50 dark:bg-dark-700">
                          Period
                        </th>
                        {(timetable.workingDays as string[]).map((day) => (
                          <th
                            key={day}
                            className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700"
                          >
                            {getDayLabel(day)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timetable.periodTimings.map((period) => (
                        <tr
                          key={period.periodNumber}
                          className={`border-b border-gray-100 dark:border-dark-700 ${
                            period.isBreak ? 'bg-gray-50 dark:bg-dark-700/50' : ''
                          }`}
                        >
                          <td className="px-3 py-3 border-r border-gray-100 dark:border-dark-700">
                            <div className="text-xs font-medium text-gray-900 dark:text-white">
                              {period.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {period.startTime} - {period.endTime}
                            </div>
                          </td>
                          {(timetable.workingDays as string[]).map((day) => {
                            if (period.isBreak) {
                              return (
                                <td
                                  key={day}
                                  className="px-2 py-3 text-center text-xs text-gray-400 dark:text-gray-500 italic"
                                >
                                  Break
                                </td>
                              )
                            }

                            const slot = getSlot(day, period.periodNumber)

                            return (
                              <td key={day} className="px-2 py-2">
                                {slot?.subject ? (
                                  <div
                                    className="rounded-lg p-2 text-center"
                                    style={{
                                      backgroundColor: (slot.subject.color || '#3B82F6') + '20',
                                      borderLeft: `3px solid ${slot.subject.color || '#3B82F6'}`,
                                    }}
                                  >
                                    <div
                                      className="text-xs font-semibold"
                                      style={{ color: slot.subject.color || '#3B82F6' }}
                                    >
                                      {slot.subject.code}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {slot.subject.name}
                                    </div>
                                    {slot.teacher && (
                                      <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 flex items-center justify-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {slot.teacher.name}
                                      </div>
                                    )}
                                    {slot.room && (
                                      <div className="text-[10px] text-gray-400 mt-0.5">
                                        {slot.room}
                                      </div>
                                    )}
                                  </div>
                                ) : slot?.slotType && slot.slotType !== 'REGULAR' ? (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                    {slot.slotType === 'FREE'
                                      ? 'Free Period'
                                      : slot.slotType === 'ASSEMBLY'
                                      ? 'Assembly'
                                      : slot.slotType}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-3 bg-gray-50 dark:bg-dark-700/30 rounded">
                                    Not assigned
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

