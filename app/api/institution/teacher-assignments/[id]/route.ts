import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateSubjectTeacherAssignment } from '@/lib/teacher-assignment/validation'
import { 
  logModification, 
  logDeactivation,
  logReactivation, 
  ASSIGNMENT_CATEGORY,
  getAssignmentHistory,
} from '@/lib/teacher-assignment/history'
import { updateTeacherCurrentPeriods } from '@/lib/teacher-assignment/workload'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/institution/teacher-assignments/[id]
 * Get a single teacher assignment with history
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const includeHistory = searchParams.get('includeHistory') === 'true'

    const assignment = await prisma.teacherClassAssignment.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            employeeId: true,
            email: true,
            phone: true,
            qualification: true,
            specialization: true,
            maxPeriodsPerWeek: true,
            currentPeriodsPerWeek: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            color: true,
            creditsPerWeek: true,
          },
        },
        academicUnit: {
          select: {
            id: true,
            name: true,
            type: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: 'Teacher assignment not found' },
        { status: 404 }
      )
    }

    // Verify tenant access or teacher access
    if (assignment.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Teachers can only view their own assignments
    if (session.user.role === 'TEACHER' && assignment.teacherId !== session.user.teacherId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get history if requested (admin only)
    let history: Awaited<ReturnType<typeof getAssignmentHistory>> = []
    if (includeHistory && session.user.role !== 'TEACHER') {
      history = await getAssignmentHistory(id, ASSIGNMENT_CATEGORY.SUBJECT_TEACHER)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...assignment,
        history,
      },
    })
  } catch (error) {
    console.error('Error fetching teacher assignment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch teacher assignment' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/institution/teacher-assignments/[id]
 * Update a teacher assignment
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const {
      teacherId,
      subjectId,
      academicUnitId,
      assignmentType,
      isPrimary,
      periodsPerWeek,
      effectiveFrom,
      effectiveTo,
      notes,
      isActive,
      changeReason,
      overrideWarnings = false,
    } = body

    // Get existing assignment
    const existing = await prisma.teacherClassAssignment.findUnique({
      where: { id },
      include: {
        teacher: true,
        subject: true,
        academicUnit: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Teacher assignment not found' },
        { status: 404 }
      )
    }

    if (existing.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // If changing key fields, validate
    if (
      (teacherId && teacherId !== existing.teacherId) ||
      (subjectId && subjectId !== existing.subjectId) ||
      (academicUnitId && academicUnitId !== existing.academicUnitId)
    ) {
      const validation = await validateSubjectTeacherAssignment({
        schoolId: session.user.schoolId,
        academicYearId: existing.academicYearId,
        academicUnitId: academicUnitId || existing.academicUnitId,
        subjectId: subjectId || existing.subjectId,
        teacherId: teacherId || existing.teacherId,
        periodsPerWeek: periodsPerWeek ?? existing.periodsPerWeek ?? undefined,
        excludeId: id,
      })

      if (!validation.isValid) {
        return NextResponse.json(
          { success: false, message: validation.errors[0], errors: validation.errors },
          { status: 400 }
        )
      }

      if (validation.warnings.length > 0 && !overrideWarnings) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Please confirm the following warnings',
            warnings: validation.warnings,
            requiresConfirmation: true,
          },
          { status: 400 }
        )
      }
    }

    // Handle deactivation
    if (isActive === false && existing.isActive === true) {
      const updated = await prisma.teacherClassAssignment.update({
        where: { id },
        data: {
          isActive: false,
          effectiveTo: new Date(),
        },
        include: {
          teacher: true,
          subject: true,
          academicUnit: true,
        },
      })

      // Update teacher's workload
      await updateTeacherCurrentPeriods(existing.teacherId, existing.academicYearId)

      await logDeactivation(ASSIGNMENT_CATEGORY.SUBJECT_TEACHER, {
        schoolId: session.user.schoolId,
        assignmentId: id,
        previousData: existing as unknown as Record<string, unknown>,
        changedBy: session.user.id,
        changeReason,
      })

      return NextResponse.json({
        success: true,
        message: `Assignment deactivated: ${updated.teacher.fullName} - ${updated.subject.name} - ${updated.academicUnit.name}`,
        data: updated,
      })
    }

    // Handle reactivation
    if (isActive === true && existing.isActive === false) {
      const updated = await prisma.teacherClassAssignment.update({
        where: { id },
        data: {
          isActive: true,
          effectiveTo: null,
        },
        include: {
          teacher: true,
          subject: true,
          academicUnit: true,
        },
      })

      // Update teacher's workload
      await updateTeacherCurrentPeriods(existing.teacherId, existing.academicYearId)

      await logReactivation(ASSIGNMENT_CATEGORY.SUBJECT_TEACHER, {
        schoolId: session.user.schoolId,
        assignmentId: id,
        newData: updated as unknown as Record<string, unknown>,
        changedBy: session.user.id,
        changeReason,
      })

      return NextResponse.json({
        success: true,
        message: `Assignment reactivated: ${updated.teacher.fullName} - ${updated.subject.name}`,
        data: updated,
      })
    }

    // Regular update
    const updated = await prisma.teacherClassAssignment.update({
      where: { id },
      data: {
        ...(teacherId && { teacherId }),
        ...(subjectId && { subjectId }),
        ...(academicUnitId && { academicUnitId }),
        ...(assignmentType && { assignmentType: assignmentType as never }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(periodsPerWeek !== undefined && { periodsPerWeek }),
        ...(effectiveFrom && { effectiveFrom: new Date(effectiveFrom) }),
        ...(effectiveTo && { effectiveTo: new Date(effectiveTo) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        teacher: true,
        subject: true,
        academicUnit: true,
      },
    })

    // Update workload if teacher or periods changed
    if (teacherId || periodsPerWeek !== undefined) {
      await updateTeacherCurrentPeriods(updated.teacherId, updated.academicYearId)
      if (teacherId && teacherId !== existing.teacherId) {
        await updateTeacherCurrentPeriods(existing.teacherId, existing.academicYearId)
      }
    }

    await logModification(ASSIGNMENT_CATEGORY.SUBJECT_TEACHER, {
      schoolId: session.user.schoolId,
      assignmentId: id,
      previousData: existing as unknown as Record<string, unknown>,
      newData: updated as unknown as Record<string, unknown>,
      changedBy: session.user.id,
      changeReason,
    })

    return NextResponse.json({
      success: true,
      message: 'Teacher assignment updated',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating teacher assignment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update teacher assignment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/institution/teacher-assignments/[id]
 * Soft delete (deactivate) a teacher assignment
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const reason = searchParams.get('reason')

    const existing = await prisma.teacherClassAssignment.findUnique({
      where: { id },
      include: {
        teacher: true,
        subject: true,
        academicUnit: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Teacher assignment not found' },
        { status: 404 }
      )
    }

    if (existing.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Soft delete
    const updated = await prisma.teacherClassAssignment.update({
      where: { id },
      data: {
        isActive: false,
        effectiveTo: new Date(),
      },
    })

    // Update teacher's workload
    await updateTeacherCurrentPeriods(existing.teacherId, existing.academicYearId)

    await logDeactivation(ASSIGNMENT_CATEGORY.SUBJECT_TEACHER, {
      schoolId: session.user.schoolId,
      assignmentId: id,
      previousData: existing as unknown as Record<string, unknown>,
      changedBy: session.user.id,
      changeReason: reason || undefined,
    })

    return NextResponse.json({
      success: true,
      message: `${existing.teacher.fullName} removed from teaching ${existing.subject.name} in ${existing.academicUnit.name}`,
      data: updated,
    })
  } catch (error) {
    console.error('Error deleting teacher assignment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to remove teacher assignment' },
      { status: 500 }
    )
  }
}
