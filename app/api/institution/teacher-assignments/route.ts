import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateSubjectTeacherAssignment } from '@/lib/teacher-assignment/validation'
import { logCreation, ASSIGNMENT_CATEGORY } from '@/lib/teacher-assignment/history'
import { updateTeacherCurrentPeriods } from '@/lib/teacher-assignment/workload'

export const dynamic = 'force-dynamic'

/**
 * GET /api/institution/teacher-assignments
 * List all subject teacher assignments with filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId')
    const academicUnitId = searchParams.get('academicUnitId')
    const subjectId = searchParams.get('subjectId')
    const teacherId = searchParams.get('teacherId')
    const assignmentType = searchParams.get('assignmentType')
    const isActive = searchParams.get('isActive')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // For teacher role, only show their own assignments
    const effectiveTeacherId = session.user.role === 'TEACHER' 
      ? session.user.teacherId 
      : teacherId

    const assignments = await prisma.teacherClassAssignment.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(academicYearId && { academicYearId }),
        ...(academicUnitId && { academicUnitId }),
        ...(subjectId && { subjectId }),
        ...(effectiveTeacherId && { teacherId: effectiveTeacherId }),
        ...(assignmentType && { assignmentType: assignmentType as never }),
        // By default, only return active assignments unless includeInactive is true
        // or isActive filter is explicitly provided
        ...(isActive !== null 
          ? { isActive: isActive === 'true' }
          : !includeInactive && { isActive: true }),
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            employeeId: true,
            email: true,
            specialization: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            color: true,
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
      orderBy: [
        { academicUnit: { displayOrder: 'asc' } },
        { subject: { displayOrder: 'asc' } },
      ],
    })

    return NextResponse.json({
      success: true,
      data: assignments,
    })
  } catch (error) {
    console.error('Error fetching teacher assignments:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch teacher assignments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/institution/teacher-assignments
 * Create a new subject teacher assignment
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can create assignments
    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Permission denied. Only admins can assign teachers.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      academicYearId,
      academicUnitId,
      subjectId,
      teacherId,
      assignmentType = 'REGULAR',
      isPrimary = true,
      periodsPerWeek,
      effectiveFrom,
      notes,
      overrideWarnings = false,
    } = body

    // Validate required fields
    if (!academicYearId || !academicUnitId || !subjectId || !teacherId) {
      return NextResponse.json(
        { success: false, message: 'Academic year, class/section, subject, and teacher are required' },
        { status: 400 }
      )
    }

    // Validate the assignment
    const validation = await validateSubjectTeacherAssignment({
      schoolId: session.user.schoolId,
      academicYearId,
      academicUnitId,
      subjectId,
      teacherId,
      periodsPerWeek,
    })

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.errors[0], errors: validation.errors },
        { status: 400 }
      )
    }

    // Check warnings if not overriding
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

    // Create the assignment
    const assignment = await prisma.teacherClassAssignment.create({
      data: {
        schoolId: session.user.schoolId,
        academicYearId,
        academicUnitId,
        subjectId,
        teacherId,
        assignmentType: assignmentType as never,
        isPrimary,
        periodsPerWeek,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        notes,
        assignedBy: session.user.id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            employeeId: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Update teacher's current periods if periodsPerWeek specified
    if (periodsPerWeek) {
      await updateTeacherCurrentPeriods(teacherId, academicYearId)
    }

    // Log the creation
    await logCreation(ASSIGNMENT_CATEGORY.SUBJECT_TEACHER, {
      schoolId: session.user.schoolId,
      assignmentId: assignment.id,
      data: assignment as unknown as Record<string, unknown>,
      changedBy: session.user.id,
    })

    return NextResponse.json({
      success: true,
      message: `${assignment.teacher.fullName} assigned to teach ${assignment.subject.name} in ${assignment.academicUnit.name}`,
      data: assignment,
    })
  } catch (error: unknown) {
    console.error('Error creating teacher assignment:', error)
    
    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'This teacher is already assigned to this subject for this class' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create teacher assignment' },
      { status: 500 }
    )
  }
}
