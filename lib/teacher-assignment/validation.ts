import prisma from '@/lib/prisma'

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Class Teacher Validation Rules
 */

// CT-1: Check if class already has a primary class teacher for the academic year
export async function checkExistingClassTeacher(
  academicUnitId: string,
  academicYearId: string,
  isPrimary: boolean,
  excludeId?: string
): Promise<{ exists: boolean; teacher?: { id: string; fullName: string } }> {
  const existing = await prisma.classTeacher.findFirst({
    where: {
      academicUnitId,
      academicYearId,
      isPrimary,
      isActive: true,
      ...(excludeId && { id: { not: excludeId } }),
    },
    include: {
      teacher: {
        select: { id: true, fullName: true },
      },
    },
  })

  return {
    exists: !!existing,
    teacher: existing?.teacher,
  }
}

// CT-3: Check teacher class teacher limit (configurable)
export async function checkTeacherClassTeacherLimit(
  teacherId: string,
  academicYearId: string,
  maxClassesAsClassTeacher: number = 3,
  excludeId?: string
): Promise<{ withinLimit: boolean; currentCount: number }> {
  const count = await prisma.classTeacher.count({
    where: {
      teacherId,
      academicYearId,
      isActive: true,
      ...(excludeId && { id: { not: excludeId } }),
    },
  })

  return {
    withinLimit: count < maxClassesAsClassTeacher,
    currentCount: count,
  }
}

// CT-5: Check if teacher is active
export async function checkTeacherIsActive(teacherId: string): Promise<boolean> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { isActive: true },
  })
  return teacher?.isActive ?? false
}

// CT-6: Check if academic unit is active
export async function checkAcademicUnitIsActive(academicUnitId: string): Promise<boolean> {
  const unit = await prisma.academicUnit.findUnique({
    where: { id: academicUnitId },
    select: { isActive: true },
  })
  return unit?.isActive ?? false
}

/**
 * Subject Teacher Validation Rules
 */

// ST-4 & ST-5: Get subject teachers with inheritance logic
export async function getSubjectTeachersWithInheritance(
  academicUnitId: string,
  subjectId: string,
  academicYearId: string
): Promise<any[]> {
  // 1. Check direct assignment to this unit
  const directAssignments = await prisma.teacherClassAssignment.findMany({
    where: {
      academicUnitId,
      subjectId,
      academicYearId,
      isActive: true,
    },
    include: {
      teacher: true,
      subject: true,
      academicUnit: true,
    },
  })

  if (directAssignments.length > 0) {
    return directAssignments
  }

  // 2. Check parent class assignment (inheritance)
  const unit = await prisma.academicUnit.findUnique({
    where: { id: academicUnitId },
    select: { parentId: true },
  })

  if (unit?.parentId) {
    return prisma.teacherClassAssignment.findMany({
      where: {
        academicUnitId: unit.parentId,
        subjectId,
        academicYearId,
        isActive: true,
      },
      include: {
        teacher: true,
        subject: true,
        academicUnit: true,
      },
    })
  }

  return []
}

// CF-3: Check for duplicate assignment
export async function checkDuplicateAssignment(
  academicUnitId: string,
  subjectId: string,
  teacherId: string,
  academicYearId: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.teacherClassAssignment.findFirst({
    where: {
      academicUnitId,
      subjectId,
      teacherId,
      academicYearId,
      isActive: true,
      ...(excludeId && { id: { not: excludeId } }),
    },
  })

  return !!existing
}

// Check if subject is active
export async function checkSubjectIsActive(subjectId: string): Promise<boolean> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { isActive: true },
  })
  return subject?.isActive ?? false
}

// Check for duplicate class teacher assignment
export async function checkDuplicateClassTeacherAssignment(
  academicUnitId: string,
  teacherId: string,
  academicYearId: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.classTeacher.findFirst({
    where: {
      academicUnitId,
      teacherId,
      academicYearId,
      isActive: true,
      ...(excludeId && { id: { not: excludeId } }),
    },
  })
  return !!existing
}

/**
 * Comprehensive validation for Class Teacher assignment
 */
export async function validateClassTeacherAssignment(params: {
  schoolId: string
  academicYearId: string
  academicUnitId: string
  teacherId: string
  isPrimary?: boolean
  excludeId?: string
  maxClassesAsClassTeacher?: number
}): Promise<ValidationResult> {
  const {
    academicYearId,
    academicUnitId,
    teacherId,
    isPrimary = true,
    excludeId,
    maxClassesAsClassTeacher = 3,
  } = params

  const errors: string[] = []
  const warnings: string[] = []

  // CT-5: Check teacher is active
  const teacherActive = await checkTeacherIsActive(teacherId)
  if (!teacherActive) {
    errors.push('Cannot assign an inactive teacher as class teacher')
  }

  // CT-6: Check academic unit is active
  const unitActive = await checkAcademicUnitIsActive(academicUnitId)
  if (!unitActive) {
    errors.push('Cannot assign class teacher to an inactive class/section')
  }

  // Check for duplicate assignment (teacher already assigned to this class)
  const isDuplicate = await checkDuplicateClassTeacherAssignment(academicUnitId, teacherId, academicYearId, excludeId)
  if (isDuplicate) {
    errors.push('This teacher is already assigned as a class teacher or co-class teacher for this class')
  }

  // CT-1: Check existing primary class teacher
  if (isPrimary) {
    const existing = await checkExistingClassTeacher(academicUnitId, academicYearId, true, excludeId)
    if (existing.exists) {
      errors.push(`This class already has a primary class teacher: ${existing.teacher?.fullName}`)
    }
  } else {
    // Check existing co-class teacher
    const existingCo = await checkExistingClassTeacher(academicUnitId, academicYearId, false, excludeId)
    if (existingCo.exists) {
      warnings.push(`This class already has a co-class teacher: ${existingCo.teacher?.fullName}. This will replace them.`)
    }
  }

  // CT-3: Check teacher limit
  const limitCheck = await checkTeacherClassTeacherLimit(teacherId, academicYearId, maxClassesAsClassTeacher, excludeId)
  if (!limitCheck.withinLimit) {
    warnings.push(`This teacher is already class teacher for ${limitCheck.currentCount} classes (limit: ${maxClassesAsClassTeacher})`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Comprehensive validation for Subject Teacher assignment
 */
export async function validateSubjectTeacherAssignment(params: {
  schoolId: string
  academicYearId: string
  academicUnitId: string
  subjectId: string
  teacherId: string
  periodsPerWeek?: number
  excludeId?: string
}): Promise<ValidationResult> {
  const {
    schoolId,
    academicYearId,
    academicUnitId,
    subjectId,
    teacherId,
    periodsPerWeek,
    excludeId,
  } = params

  const errors: string[] = []
  const warnings: string[] = []

  // Check teacher is active
  const teacherActive = await checkTeacherIsActive(teacherId)
  if (!teacherActive) {
    errors.push('Cannot assign an inactive teacher')
  }

  // Check academic unit is active
  const unitActive = await checkAcademicUnitIsActive(academicUnitId)
  if (!unitActive) {
    errors.push('Cannot assign teacher to an inactive class/section')
  }

  // Check subject is active
  const subjectActive = await checkSubjectIsActive(subjectId)
  if (!subjectActive) {
    errors.push('Cannot assign teacher to an inactive subject')
  }

  // CF-3: Check for duplicate assignment
  const isDuplicate = await checkDuplicateAssignment(academicUnitId, subjectId, teacherId, academicYearId, excludeId)
  if (isDuplicate) {
    errors.push('This teacher is already assigned to this subject for this class')
  }

  // Check workload if periods specified
  if (periodsPerWeek) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { maxPeriodsPerWeek: true, currentPeriodsPerWeek: true },
    })

    if (teacher) {
      const newTotal = teacher.currentPeriodsPerWeek + periodsPerWeek
      if (newTotal > teacher.maxPeriodsPerWeek) {
        warnings.push(
          `Adding ${periodsPerWeek} periods will exceed teacher's weekly limit ` +
          `(current: ${teacher.currentPeriodsPerWeek}, max: ${teacher.maxPeriodsPerWeek})`
        )
      }
      
      // Hard block at 150%
      if (newTotal > teacher.maxPeriodsPerWeek * 1.5) {
        errors.push(
          `Cannot assign - teacher would exceed 150% of weekly period limit ` +
          `(current: ${teacher.currentPeriodsPerWeek}, adding: ${periodsPerWeek}, max: ${teacher.maxPeriodsPerWeek})`
        )
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate bulk assignments
 */
export async function validateBulkAssignments(
  assignments: Array<{
    academicUnitId: string
    subjectId: string
    teacherId: string
  }>,
  schoolId: string,
  academicYearId: string
): Promise<{ valid: typeof assignments; invalid: Array<{ assignment: typeof assignments[0]; errors: string[] }> }> {
  const valid: typeof assignments = []
  const invalid: Array<{ assignment: typeof assignments[0]; errors: string[] }> = []

  for (const assignment of assignments) {
    const result = await validateSubjectTeacherAssignment({
      schoolId,
      academicYearId,
      ...assignment,
    })

    if (result.isValid) {
      valid.push(assignment)
    } else {
      invalid.push({ assignment, errors: result.errors })
    }
  }

  return { valid, invalid }
}

/**
 * Check if all subjects in a class have assigned teachers (for timetable publish validation)
 */
export async function validateAllSubjectsHaveTeachers(
  academicUnitId: string,
  academicYearId: string
): Promise<{ isValid: boolean; missingSubjects: Array<{ id: string; name: string }> }> {
  // Get all active subjects for the school
  const unit = await prisma.academicUnit.findUnique({
    where: { id: academicUnitId },
    include: { school: { include: { subjects: { where: { isActive: true } } } } },
  })

  if (!unit) {
    return { isValid: false, missingSubjects: [] }
  }

  const missingSubjects: Array<{ id: string; name: string }> = []

  for (const subject of unit.school.subjects) {
    const teachers = await getSubjectTeachersWithInheritance(academicUnitId, subject.id, academicYearId)
    if (teachers.length === 0) {
      missingSubjects.push({ id: subject.id, name: subject.name })
    }
  }

  return {
    isValid: missingSubjects.length === 0,
    missingSubjects,
  }
}
