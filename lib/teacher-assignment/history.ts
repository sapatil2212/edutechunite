import prisma from '@/lib/prisma'

/**
 * Assignment History Categories
 */
export const ASSIGNMENT_CATEGORY = {
  CLASS_TEACHER: 'CLASS_TEACHER',
  SUBJECT_TEACHER: 'SUBJECT_TEACHER',
} as const

export type AssignmentCategory = typeof ASSIGNMENT_CATEGORY[keyof typeof ASSIGNMENT_CATEGORY]

/**
 * History Actions
 */
export const HISTORY_ACTION = {
  CREATED: 'CREATED',
  MODIFIED: 'MODIFIED',
  DEACTIVATED: 'DEACTIVATED',
  REACTIVATED: 'REACTIVATED',
} as const

export type HistoryAction = typeof HISTORY_ACTION[keyof typeof HISTORY_ACTION]

/**
 * Log a class teacher assignment change
 */
export async function logClassTeacherChange(params: {
  schoolId: string
  assignmentId: string
  action: HistoryAction
  previousData?: Record<string, unknown>
  newData?: Record<string, unknown>
  changedBy: string
  changeReason?: string
}): Promise<void> {
  await prisma.teacherAssignmentHistory.create({
    data: {
      schoolId: params.schoolId,
      assignmentCategory: ASSIGNMENT_CATEGORY.CLASS_TEACHER,
      assignmentId: params.assignmentId,
      action: params.action,
      previousData: params.previousData || undefined,
      newData: params.newData || undefined,
      changedBy: params.changedBy,
      changeReason: params.changeReason,
    },
  })
}

/**
 * Log a subject teacher assignment change
 */
export async function logSubjectTeacherChange(params: {
  schoolId: string
  assignmentId: string
  action: HistoryAction
  previousData?: Record<string, unknown>
  newData?: Record<string, unknown>
  changedBy: string
  changeReason?: string
}): Promise<void> {
  await prisma.teacherAssignmentHistory.create({
    data: {
      schoolId: params.schoolId,
      assignmentCategory: ASSIGNMENT_CATEGORY.SUBJECT_TEACHER,
      assignmentId: params.assignmentId,
      action: params.action,
      previousData: params.previousData || undefined,
      newData: params.newData || undefined,
      changedBy: params.changedBy,
      changeReason: params.changeReason,
    },
  })
}

/**
 * Get history for a specific assignment
 */
export async function getAssignmentHistory(
  assignmentId: string,
  category: AssignmentCategory
): Promise<Array<{
  id: string
  action: string
  previousData: unknown
  newData: unknown
  changeReason: string | null
  changedBy: string
  changedAt: Date
}>> {
  const history = await prisma.teacherAssignmentHistory.findMany({
    where: {
      assignmentId,
      assignmentCategory: category,
    },
    orderBy: {
      changedAt: 'desc',
    },
  })

  return history.map((h) => ({
    id: h.id,
    action: h.action,
    previousData: h.previousData,
    newData: h.newData,
    changeReason: h.changeReason,
    changedBy: h.changedBy,
    changedAt: h.changedAt,
  }))
}

/**
 * Get recent assignment changes for a school
 */
export async function getRecentAssignmentChanges(
  schoolId: string,
  options?: {
    limit?: number
    category?: AssignmentCategory
    startDate?: Date
    endDate?: Date
  }
): Promise<Array<{
  id: string
  assignmentCategory: string
  assignmentId: string
  action: string
  changeReason: string | null
  changedBy: string
  changedAt: Date
}>> {
  const { limit = 50, category, startDate, endDate } = options || {}

  const history = await prisma.teacherAssignmentHistory.findMany({
    where: {
      schoolId,
      ...(category && { assignmentCategory: category }),
      ...(startDate && { changedAt: { gte: startDate } }),
      ...(endDate && { changedAt: { lte: endDate } }),
    },
    orderBy: {
      changedAt: 'desc',
    },
    take: limit,
  })

  return history.map((h) => ({
    id: h.id,
    assignmentCategory: h.assignmentCategory,
    assignmentId: h.assignmentId,
    action: h.action,
    changeReason: h.changeReason,
    changedBy: h.changedBy,
    changedAt: h.changedAt,
  }))
}

/**
 * Create snapshot of assignment data for history
 */
export function createAssignmentSnapshot(assignment: Record<string, unknown>): Record<string, unknown> {
  // Remove Prisma-specific fields and relations
  const {
    school,
    academicYear,
    academicUnit,
    teacher,
    subject,
    createdAt,
    updatedAt,
    ...snapshot
  } = assignment

  return snapshot
}

/**
 * Helper to log creation
 */
export async function logCreation(
  category: AssignmentCategory,
  params: {
    schoolId: string
    assignmentId: string
    data: Record<string, unknown>
    changedBy: string
  }
): Promise<void> {
  const logFn = category === ASSIGNMENT_CATEGORY.CLASS_TEACHER
    ? logClassTeacherChange
    : logSubjectTeacherChange

  await logFn({
    schoolId: params.schoolId,
    assignmentId: params.assignmentId,
    action: HISTORY_ACTION.CREATED,
    newData: createAssignmentSnapshot(params.data),
    changedBy: params.changedBy,
  })
}

/**
 * Helper to log modification
 */
export async function logModification(
  category: AssignmentCategory,
  params: {
    schoolId: string
    assignmentId: string
    previousData: Record<string, unknown>
    newData: Record<string, unknown>
    changedBy: string
    changeReason?: string
  }
): Promise<void> {
  const logFn = category === ASSIGNMENT_CATEGORY.CLASS_TEACHER
    ? logClassTeacherChange
    : logSubjectTeacherChange

  await logFn({
    schoolId: params.schoolId,
    assignmentId: params.assignmentId,
    action: HISTORY_ACTION.MODIFIED,
    previousData: createAssignmentSnapshot(params.previousData),
    newData: createAssignmentSnapshot(params.newData),
    changedBy: params.changedBy,
    changeReason: params.changeReason,
  })
}

/**
 * Helper to log deactivation
 */
export async function logDeactivation(
  category: AssignmentCategory,
  params: {
    schoolId: string
    assignmentId: string
    previousData: Record<string, unknown>
    changedBy: string
    changeReason?: string
  }
): Promise<void> {
  const logFn = category === ASSIGNMENT_CATEGORY.CLASS_TEACHER
    ? logClassTeacherChange
    : logSubjectTeacherChange

  await logFn({
    schoolId: params.schoolId,
    assignmentId: params.assignmentId,
    action: HISTORY_ACTION.DEACTIVATED,
    previousData: createAssignmentSnapshot(params.previousData),
    changedBy: params.changedBy,
    changeReason: params.changeReason,
  })
}

/**
 * Helper to log reactivation
 */
export async function logReactivation(
  category: AssignmentCategory,
  params: {
    schoolId: string
    assignmentId: string
    newData: Record<string, unknown>
    changedBy: string
    changeReason?: string
  }
): Promise<void> {
  const logFn = category === ASSIGNMENT_CATEGORY.CLASS_TEACHER
    ? logClassTeacherChange
    : logSubjectTeacherChange

  await logFn({
    schoolId: params.schoolId,
    assignmentId: params.assignmentId,
    action: HISTORY_ACTION.REACTIVATED,
    newData: createAssignmentSnapshot(params.newData),
    changedBy: params.changedBy,
    changeReason: params.changeReason,
  })
}

/**
 * Get audit report for an academic year
 */
export async function getAuditReport(
  schoolId: string,
  academicYearId: string,
  options?: {
    category?: AssignmentCategory
  }
): Promise<{
  totalChanges: number
  changesByAction: Record<string, number>
  changesByCategory: Record<string, number>
  recentChanges: Array<{
    id: string
    assignmentCategory: string
    action: string
    changedAt: Date
  }>
}> {
  const { category } = options || {}

  // Get all changes for the period
  const changes = await prisma.teacherAssignmentHistory.findMany({
    where: {
      schoolId,
      ...(category && { assignmentCategory: category }),
    },
    orderBy: {
      changedAt: 'desc',
    },
  })

  // Aggregate by action
  const changesByAction: Record<string, number> = {}
  const changesByCategory: Record<string, number> = {}

  for (const change of changes) {
    changesByAction[change.action] = (changesByAction[change.action] || 0) + 1
    changesByCategory[change.assignmentCategory] = (changesByCategory[change.assignmentCategory] || 0) + 1
  }

  return {
    totalChanges: changes.length,
    changesByAction,
    changesByCategory,
    recentChanges: changes.slice(0, 20).map((c) => ({
      id: c.id,
      assignmentCategory: c.assignmentCategory,
      action: c.action,
      changedAt: c.changedAt,
    })),
  }
}
