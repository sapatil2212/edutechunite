import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateClassTeacherAssignment } from '@/lib/teacher-assignment/validation'
import { 
  logModification, 
  logDeactivation,
  logReactivation, 
  ASSIGNMENT_CATEGORY,
  getAssignmentHistory,
} from '@/lib/teacher-assignment/history'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/institution/class-teachers/[id]
 * Get a single class teacher assignment with history
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

    const classTeacher = await prisma.classTeacher.findUnique({
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

    if (!classTeacher) {
      return NextResponse.json(
        { success: false, message: 'Class teacher assignment not found' },
        { status: 404 }
      )
    }

    // Verify tenant access
    if (classTeacher.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get history if requested
    let history: Awaited<ReturnType<typeof getAssignmentHistory>> = []
    if (includeHistory) {
      history = await getAssignmentHistory(id, ASSIGNMENT_CATEGORY.CLASS_TEACHER)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...classTeacher,
        history,
      },
    })
  } catch (error) {
    console.error('Error fetching class teacher:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch class teacher' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/institution/class-teachers/[id]
 * Update a class teacher assignment
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
      isPrimary,
      effectiveFrom,
      effectiveTo,
      notes,
      isActive,
      changeReason,
      overrideWarnings = false,
    } = body

    // Get existing assignment
    const existing = await prisma.classTeacher.findUnique({
      where: { id },
      include: {
        teacher: true,
        academicUnit: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Class teacher assignment not found' },
        { status: 404 }
      )
    }

    if (existing.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // If changing teacher, validate new assignment
    if (teacherId && teacherId !== existing.teacherId) {
      const validation = await validateClassTeacherAssignment({
        schoolId: session.user.schoolId,
        academicYearId: existing.academicYearId,
        academicUnitId: existing.academicUnitId,
        teacherId,
        isPrimary: isPrimary ?? existing.isPrimary,
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
      const updated = await prisma.classTeacher.update({
        where: { id },
        data: {
          isActive: false,
          effectiveTo: new Date(),
        },
        include: {
          teacher: true,
          academicUnit: true,
        },
      })

      await logDeactivation(ASSIGNMENT_CATEGORY.CLASS_TEACHER, {
        schoolId: session.user.schoolId,
        assignmentId: id,
        previousData: existing as unknown as Record<string, unknown>,
        changedBy: session.user.id,
        changeReason,
      })

      return NextResponse.json({
        success: true,
        message: `Class teacher assignment deactivated for ${updated.academicUnit.name}`,
        data: updated,
      })
    }

    // Handle reactivation
    if (isActive === true && existing.isActive === false) {
      const updated = await prisma.classTeacher.update({
        where: { id },
        data: {
          isActive: true,
          effectiveTo: null,
        },
        include: {
          teacher: true,
          academicUnit: true,
        },
      })

      await logReactivation(ASSIGNMENT_CATEGORY.CLASS_TEACHER, {
        schoolId: session.user.schoolId,
        assignmentId: id,
        newData: updated as unknown as Record<string, unknown>,
        changedBy: session.user.id,
        changeReason,
      })

      return NextResponse.json({
        success: true,
        message: `Class teacher assignment reactivated for ${updated.academicUnit.name}`,
        data: updated,
      })
    }

    // Regular update
    const updated = await prisma.classTeacher.update({
      where: { id },
      data: {
        ...(teacherId && { teacherId }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(effectiveFrom && { effectiveFrom: new Date(effectiveFrom) }),
        ...(effectiveTo && { effectiveTo: new Date(effectiveTo) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        teacher: true,
        academicUnit: true,
      },
    })

    await logModification(ASSIGNMENT_CATEGORY.CLASS_TEACHER, {
      schoolId: session.user.schoolId,
      assignmentId: id,
      previousData: existing as unknown as Record<string, unknown>,
      newData: updated as unknown as Record<string, unknown>,
      changedBy: session.user.id,
      changeReason,
    })

    return NextResponse.json({
      success: true,
      message: 'Class teacher assignment updated',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating class teacher:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update class teacher assignment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/institution/class-teachers/[id]
 * Soft delete (deactivate) a class teacher assignment
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

    const existing = await prisma.classTeacher.findUnique({
      where: { id },
      include: {
        teacher: true,
        academicUnit: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Class teacher assignment not found' },
        { status: 404 }
      )
    }

    if (existing.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Soft delete - deactivate the assignment
    const updated = await prisma.classTeacher.update({
      where: { id },
      data: {
        isActive: false,
        effectiveTo: new Date(),
      },
    })

    await logDeactivation(ASSIGNMENT_CATEGORY.CLASS_TEACHER, {
      schoolId: session.user.schoolId,
      assignmentId: id,
      previousData: existing as unknown as Record<string, unknown>,
      changedBy: session.user.id,
      changeReason: reason || undefined,
    })

    return NextResponse.json({
      success: true,
      message: `${existing.teacher.fullName} removed as class teacher from ${existing.academicUnit.name}`,
      data: updated,
    })
  } catch (error) {
    console.error('Error deleting class teacher:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to remove class teacher assignment' },
      { status: 500 }
    )
  }
}
