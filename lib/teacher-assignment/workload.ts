import prisma from '@/lib/prisma'

/**
 * Teacher Workload Summary
 */
export interface WorkloadSummary {
  teacherId: string
  teacherName: string
  maxPeriodsPerDay: number
  maxPeriodsPerWeek: number
  currentPeriodsPerWeek: number
  utilizationPercent: number
  assignmentCount: number
  classTeacherCount: number
  assignments: Array<{
    id: string
    className: string
    subjectName: string
    periodsPerWeek: number | null
    assignmentType: string
  }>
  classTeacherFor: Array<{
    id: string
    className: string
    isPrimary: boolean
  }>
  timetableSlots: {
    total: number
    byDay: Record<string, number>
  }
  warnings: string[]
}

/**
 * Get comprehensive workload summary for a teacher
 */
export async function getTeacherWorkloadSummary(
  teacherId: string,
  academicYearId: string
): Promise<WorkloadSummary | null> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      teacherClassAssignments: {
        where: {
          academicYearId,
          isActive: true,
        },
        include: {
          academicUnit: true,
          subject: true,
        },
      },
      classTeacherAssignments: {
        where: {
          academicYearId,
          isActive: true,
        },
        include: {
          academicUnit: true,
        },
      },
      timetableSlots: {
        where: {
          timetable: {
            academicUnit: {
              academicYearId,
            },
            status: 'PUBLISHED',
          },
          isActive: true,
        },
      },
    },
  })

  if (!teacher) {
    return null
  }

  // Calculate timetable slots by day
  const slotsByDay: Record<string, number> = {}
  for (const slot of teacher.timetableSlots) {
    slotsByDay[slot.dayOfWeek] = (slotsByDay[slot.dayOfWeek] || 0) + 1
  }

  // Calculate current periods from timetable
  const totalTimetableSlots = teacher.timetableSlots.length

  // Calculate utilization
  const utilizationPercent = teacher.maxPeriodsPerWeek > 0
    ? Math.round((totalTimetableSlots / teacher.maxPeriodsPerWeek) * 100)
    : 0

  // Generate warnings
  const warnings: string[] = []
  
  // Check weekly limit
  if (totalTimetableSlots > teacher.maxPeriodsPerWeek) {
    warnings.push(`Exceeds weekly period limit (${totalTimetableSlots}/${teacher.maxPeriodsPerWeek})`)
  } else if (totalTimetableSlots > teacher.maxPeriodsPerWeek * 0.9) {
    warnings.push(`Near weekly period limit (${totalTimetableSlots}/${teacher.maxPeriodsPerWeek})`)
  }

  // Check daily limits
  for (const [day, count] of Object.entries(slotsByDay)) {
    if (count > teacher.maxPeriodsPerDay) {
      warnings.push(`Exceeds daily limit on ${day} (${count}/${teacher.maxPeriodsPerDay})`)
    }
  }

  return {
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    maxPeriodsPerDay: teacher.maxPeriodsPerDay,
    maxPeriodsPerWeek: teacher.maxPeriodsPerWeek,
    currentPeriodsPerWeek: teacher.currentPeriodsPerWeek,
    utilizationPercent,
    assignmentCount: teacher.teacherClassAssignments.length,
    classTeacherCount: teacher.classTeacherAssignments.length,
    assignments: teacher.teacherClassAssignments.map((a) => ({
      id: a.id,
      className: a.academicUnit.name,
      subjectName: a.subject.name,
      periodsPerWeek: a.periodsPerWeek,
      assignmentType: a.assignmentType,
    })),
    classTeacherFor: teacher.classTeacherAssignments.map((ct) => ({
      id: ct.id,
      className: ct.academicUnit.name,
      isPrimary: ct.isPrimary,
    })),
    timetableSlots: {
      total: totalTimetableSlots,
      byDay: slotsByDay,
    },
    warnings,
  }
}

/**
 * Update teacher's currentPeriodsPerWeek based on assignments
 */
export async function updateTeacherCurrentPeriods(
  teacherId: string,
  academicYearId: string
): Promise<number> {
  // Sum all periodsPerWeek from active assignments
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: {
      teacherId,
      academicYearId,
      isActive: true,
      periodsPerWeek: { not: null },
    },
    select: {
      periodsPerWeek: true,
    },
  })

  const totalPeriods = assignments.reduce((sum, a) => sum + (a.periodsPerWeek || 0), 0)

  // Update teacher's currentPeriodsPerWeek
  await prisma.teacher.update({
    where: { id: teacherId },
    data: { currentPeriodsPerWeek: totalPeriods },
  })

  return totalPeriods
}

/**
 * Get workload status for all teachers in a school
 */
export async function getSchoolTeacherWorkloads(
  schoolId: string,
  academicYearId: string
): Promise<Array<{
  teacherId: string
  teacherName: string
  employeeId: string
  assignmentCount: number
  classTeacherCount: number
  timetableSlots: number
  maxPeriodsPerWeek: number
  utilizationPercent: number
  status: 'underutilized' | 'optimal' | 'high' | 'overloaded'
}>> {
  const teachers = await prisma.teacher.findMany({
    where: {
      schoolId,
      isActive: true,
    },
    include: {
      teacherClassAssignments: {
        where: {
          academicYearId,
          isActive: true,
        },
      },
      classTeacherAssignments: {
        where: {
          academicYearId,
          isActive: true,
        },
      },
      timetableSlots: {
        where: {
          timetable: {
            academicUnit: {
              academicYearId,
            },
            status: 'PUBLISHED',
          },
          isActive: true,
        },
      },
    },
  })

  return teachers.map((teacher) => {
    const timetableSlots = teacher.timetableSlots.length
    const utilizationPercent = teacher.maxPeriodsPerWeek > 0
      ? Math.round((timetableSlots / teacher.maxPeriodsPerWeek) * 100)
      : 0

    let status: 'underutilized' | 'optimal' | 'high' | 'overloaded'
    if (utilizationPercent < 50) {
      status = 'underutilized'
    } else if (utilizationPercent <= 85) {
      status = 'optimal'
    } else if (utilizationPercent <= 100) {
      status = 'high'
    } else {
      status = 'overloaded'
    }

    return {
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      employeeId: teacher.employeeId,
      assignmentCount: teacher.teacherClassAssignments.length,
      classTeacherCount: teacher.classTeacherAssignments.length,
      timetableSlots,
      maxPeriodsPerWeek: teacher.maxPeriodsPerWeek,
      utilizationPercent,
      status,
    }
  })
}

/**
 * Calculate expected workload when adding a new assignment
 */
export async function calculateProjectedWorkload(
  teacherId: string,
  academicYearId: string,
  additionalPeriods: number
): Promise<{
  current: number
  projected: number
  max: number
  exceedsLimit: boolean
  exceeds150Percent: boolean
}> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      maxPeriodsPerWeek: true,
      currentPeriodsPerWeek: true,
    },
  })

  if (!teacher) {
    throw new Error('Teacher not found')
  }

  const current = teacher.currentPeriodsPerWeek
  const projected = current + additionalPeriods
  const max = teacher.maxPeriodsPerWeek

  return {
    current,
    projected,
    max,
    exceedsLimit: projected > max,
    exceeds150Percent: projected > max * 1.5,
  }
}

/**
 * Find available teachers for a subject assignment
 * Filters by active status and workload capacity
 */
export async function findAvailableTeachers(
  schoolId: string,
  academicYearId: string,
  subjectId?: string,
  periodsNeeded?: number
): Promise<Array<{
  teacher: {
    id: string
    fullName: string
    employeeId: string
    specialization: string | null
  }
  currentWorkload: number
  maxWorkload: number
  availableCapacity: number
  isQualified: boolean // Based on TeacherSubject relation
}>> {
  const teachers = await prisma.teacher.findMany({
    where: {
      schoolId,
      isActive: true,
    },
    include: {
      subjectAssignments: subjectId
        ? {
            where: { subjectId },
          }
        : true,
      timetableSlots: {
        where: {
          timetable: {
            academicUnit: { academicYearId },
            status: 'PUBLISHED',
          },
          isActive: true,
        },
      },
    },
  })

  return teachers
    .map((teacher) => {
      const currentWorkload = teacher.timetableSlots.length
      const availableCapacity = teacher.maxPeriodsPerWeek - currentWorkload

      return {
        teacher: {
          id: teacher.id,
          fullName: teacher.fullName,
          employeeId: teacher.employeeId,
          specialization: teacher.specialization,
        },
        currentWorkload,
        maxWorkload: teacher.maxPeriodsPerWeek,
        availableCapacity,
        isQualified: subjectId 
          ? teacher.subjectAssignments.some((sa) => sa.subjectId === subjectId)
          : true,
      }
    })
    .filter((t) => !periodsNeeded || t.availableCapacity >= periodsNeeded)
    .sort((a, b) => b.availableCapacity - a.availableCapacity)
}
