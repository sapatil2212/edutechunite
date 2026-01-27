import prisma from '@/lib/prisma'

export interface ConflictResult {
  hasConflict: boolean
  type: 'TEACHER_BUSY' | 'CLASS_OCCUPIED' | 'WORKLOAD_EXCEEDED' | 'TIME_OVERLAP' | 'NONE'
  message: string
  details?: {
    conflictingSlot?: {
      id: string
      className: string
      subjectName: string
      teacherName?: string
    }
    workload?: {
      current: number
      max: number
    }
  }
}

export interface SlotAssignment {
  timetableId: string
  dayOfWeek: string
  periodNumber: number
  subjectId?: string | null
  teacherId?: string | null
  academicUnitId: string
  slotId?: string // If editing existing slot
}

/**
 * Check for teacher conflicts - same teacher assigned to multiple classes at the same time
 */
export async function checkTeacherConflict(
  schoolId: string,
  teacherId: string,
  dayOfWeek: string,
  periodNumber: number,
  excludeSlotId?: string
): Promise<ConflictResult> {
  try {
    // Find any other slots where this teacher is assigned at the same time
    const conflictingSlot = await prisma.timetableSlot.findFirst({
      where: {
        schoolId,
        teacherId,
        dayOfWeek: dayOfWeek as any,
        periodNumber,
        isActive: true,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
        timetable: {
          status: { in: ['DRAFT', 'PUBLISHED'] }
        }
      },
      include: {
        academicUnit: true,
        subject: true,
        teacher: true,
      },
    })

    if (conflictingSlot) {
      return {
        hasConflict: true,
        type: 'TEACHER_BUSY',
        message: `Teacher is already assigned to ${conflictingSlot.academicUnit.name} for ${conflictingSlot.subject?.name || 'a period'} at this time`,
        details: {
          conflictingSlot: {
            id: conflictingSlot.id,
            className: conflictingSlot.academicUnit.name,
            subjectName: conflictingSlot.subject?.name || 'Unknown',
            teacherName: conflictingSlot.teacher?.fullName,
          },
        },
      }
    }

    return { hasConflict: false, type: 'NONE', message: '' }
  } catch (error) {
    console.error('Teacher conflict check error:', error)
    return { hasConflict: false, type: 'NONE', message: '' }
  }
}

/**
 * Check for class conflicts - same class having two subjects at the same time
 */
export async function checkClassConflict(
  timetableId: string,
  dayOfWeek: string,
  periodNumber: number,
  excludeSlotId?: string
): Promise<ConflictResult> {
  try {
    const conflictingSlot = await prisma.timetableSlot.findFirst({
      where: {
        timetableId,
        dayOfWeek: dayOfWeek as any,
        periodNumber,
        isActive: true,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
      },
      include: {
        subject: true,
        teacher: true,
      },
    })

    if (conflictingSlot) {
      return {
        hasConflict: true,
        type: 'CLASS_OCCUPIED',
        message: `This period already has ${conflictingSlot.subject?.name || 'a subject'} assigned`,
        details: {
          conflictingSlot: {
            id: conflictingSlot.id,
            className: '',
            subjectName: conflictingSlot.subject?.name || 'Unknown',
            teacherName: conflictingSlot.teacher?.fullName,
          },
        },
      }
    }

    return { hasConflict: false, type: 'NONE', message: '' }
  } catch (error) {
    console.error('Class conflict check error:', error)
    return { hasConflict: false, type: 'NONE', message: '' }
  }
}

/**
 * Check teacher workload limits
 */
export async function checkTeacherWorkload(
  schoolId: string,
  teacherId: string,
  dayOfWeek?: string
): Promise<ConflictResult> {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        maxPeriodsPerDay: true,
        maxPeriodsPerWeek: true,
        fullName: true,
      },
    })

    if (!teacher) {
      return { hasConflict: false, type: 'NONE', message: '' }
    }

    // Count current slots for this teacher
    const slotsQuery: any = {
      schoolId,
      teacherId,
      isActive: true,
      timetable: {
        status: { in: ['DRAFT', 'PUBLISHED'] }
      }
    }

    if (dayOfWeek) {
      // Check daily limit
      slotsQuery.dayOfWeek = dayOfWeek

      const dailyCount = await prisma.timetableSlot.count({ where: slotsQuery })

      if (dailyCount >= teacher.maxPeriodsPerDay) {
        return {
          hasConflict: true,
          type: 'WORKLOAD_EXCEEDED',
          message: `${teacher.fullName} has reached daily limit of ${teacher.maxPeriodsPerDay} periods`,
          details: {
            workload: {
              current: dailyCount,
              max: teacher.maxPeriodsPerDay,
            },
          },
        }
      }
    }

    // Check weekly limit
    delete slotsQuery.dayOfWeek
    const weeklyCount = await prisma.timetableSlot.count({ where: slotsQuery })

    if (weeklyCount >= teacher.maxPeriodsPerWeek) {
      return {
        hasConflict: true,
        type: 'WORKLOAD_EXCEEDED',
        message: `${teacher.fullName} has reached weekly limit of ${teacher.maxPeriodsPerWeek} periods`,
        details: {
          workload: {
            current: weeklyCount,
            max: teacher.maxPeriodsPerWeek,
          },
        },
      }
    }

    return { hasConflict: false, type: 'NONE', message: '' }
  } catch (error) {
    console.error('Workload check error:', error)
    return { hasConflict: false, type: 'NONE', message: '' }
  }
}

/**
 * Validate a slot assignment for all possible conflicts
 */
export async function validateSlotAssignment(
  schoolId: string,
  assignment: SlotAssignment
): Promise<ConflictResult[]> {
  const conflicts: ConflictResult[] = []

  // Check class conflict (only if not editing existing slot at same position)
  const classConflict = await checkClassConflict(
    assignment.timetableId,
    assignment.dayOfWeek,
    assignment.periodNumber,
    assignment.slotId
  )
  if (classConflict.hasConflict) {
    conflicts.push(classConflict)
  }

  // Check teacher conflicts if teacher is assigned
  if (assignment.teacherId) {
    const teacherConflict = await checkTeacherConflict(
      schoolId,
      assignment.teacherId,
      assignment.dayOfWeek,
      assignment.periodNumber,
      assignment.slotId
    )
    if (teacherConflict.hasConflict) {
      conflicts.push(teacherConflict)
    }

    // Check workload
    const workloadConflict = await checkTeacherWorkload(
      schoolId,
      assignment.teacherId,
      assignment.dayOfWeek
    )
    if (workloadConflict.hasConflict) {
      conflicts.push(workloadConflict)
    }
  }

  return conflicts
}

/**
 * Get available teachers for a specific slot
 */
export async function getAvailableTeachers(
  schoolId: string,
  dayOfWeek: string,
  periodNumber: number,
  subjectId?: string
): Promise<{
  id: string
  fullName: string
  employeeId: string
  currentLoad: { daily: number; weekly: number }
  maxLoad: { daily: number; weekly: number }
}[]> {
  try {
    // Get all active teachers
    let teachers = await prisma.teacher.findMany({
      where: {
        schoolId,
        isActive: true,
        ...(subjectId && {
          subjectAssignments: {
            some: { subjectId }
          }
        })
      },
      select: {
        id: true,
        fullName: true,
        employeeId: true,
        maxPeriodsPerDay: true,
        maxPeriodsPerWeek: true,
      },
    })

    // Get busy teachers at this time slot
    const busyTeacherIds = await prisma.timetableSlot.findMany({
      where: {
        schoolId,
        dayOfWeek: dayOfWeek as any,
        periodNumber,
        isActive: true,
        teacherId: { not: null },
        timetable: {
          status: { in: ['DRAFT', 'PUBLISHED'] }
        }
      },
      select: { teacherId: true },
    })

    const busyIds = new Set(busyTeacherIds.map((s) => s.teacherId))

    // Filter out busy teachers and get their workloads
    const availableTeachers = await Promise.all(
      teachers
        .filter((t) => !busyIds.has(t.id))
        .map(async (teacher) => {
          const dailyCount = await prisma.timetableSlot.count({
            where: {
              schoolId,
              teacherId: teacher.id,
              dayOfWeek: dayOfWeek as any,
              isActive: true,
              timetable: { status: { in: ['DRAFT', 'PUBLISHED'] } }
            },
          })

          const weeklyCount = await prisma.timetableSlot.count({
            where: {
              schoolId,
              teacherId: teacher.id,
              isActive: true,
              timetable: { status: { in: ['DRAFT', 'PUBLISHED'] } }
            },
          })

          return {
            id: teacher.id,
            fullName: teacher.fullName,
            employeeId: teacher.employeeId,
            currentLoad: { daily: dailyCount, weekly: weeklyCount },
            maxLoad: { daily: teacher.maxPeriodsPerDay, weekly: teacher.maxPeriodsPerWeek },
          }
        })
    )

    // Filter out teachers who exceeded their limits
    return availableTeachers.filter(
      (t) =>
        t.currentLoad.daily < t.maxLoad.daily && t.currentLoad.weekly < t.maxLoad.weekly
    )
  } catch (error) {
    console.error('Get available teachers error:', error)
    return []
  }
}

/**
 * Get subject distribution stats for a timetable
 */
export async function getSubjectDistribution(timetableId: string): Promise<{
  subjectId: string
  subjectName: string
  subjectCode: string
  count: number
  requiredPerWeek: number
  status: 'OK' | 'UNDER' | 'OVER'
}[]> {
  try {
    const timetable = await prisma.timetable.findUnique({
      where: { id: timetableId },
      include: {
        slots: {
          where: { isActive: true, slotType: 'REGULAR' },
          include: { subject: true },
        },
      },
    })

    if (!timetable) return []

    // Group by subject
    const subjectCounts = new Map<string, { name: string; code: string; count: number }>()

    for (const slot of timetable.slots) {
      if (slot.subject) {
        const existing = subjectCounts.get(slot.subjectId!) || {
          name: slot.subject.name,
          code: slot.subject.code,
          count: 0,
        }
        existing.count++
        subjectCounts.set(slot.subjectId!, existing)
      }
    }

    // Get all subjects with their required periods
    const subjects = await prisma.subject.findMany({
      where: { schoolId: timetable.schoolId, isActive: true },
      select: { id: true, name: true, code: true, creditsPerWeek: true },
    })

    return subjects.map((subject) => {
      const current = subjectCounts.get(subject.id)
      const count = current?.count || 0
      const required = subject.creditsPerWeek

      let status: 'OK' | 'UNDER' | 'OVER' = 'OK'
      if (count < required) status = 'UNDER'
      if (count > required) status = 'OVER'

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        count,
        requiredPerWeek: required,
        status,
      }
    })
  } catch (error) {
    console.error('Subject distribution error:', error)
    return []
  }
}

