import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateClassTeacherAssignment } from '@/lib/teacher-assignment/validation'
import { logCreation, ASSIGNMENT_CATEGORY } from '@/lib/teacher-assignment/history'

export const dynamic = 'force-dynamic'

/**
 * GET /api/institution/class-teachers
 * List all class teacher assignments with filters
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
    const teacherId = searchParams.get('teacherId')
    const isActive = searchParams.get('isActive')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const classTeachers = await prisma.classTeacher.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(academicYearId && { academicYearId }),
        ...(academicUnitId && { academicUnitId }),
        ...(teacherId && { teacherId }),
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
            phone: true,
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
        { isPrimary: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: classTeachers,
    })
  } catch (error) {
    console.error('Error fetching class teachers:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch class teachers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/institution/class-teachers
 * Assign a class teacher to a class/section
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

    // Only admins can assign class teachers
    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Permission denied. Only admins can assign class teachers.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      academicYearId,
      academicUnitId,
      classId,
      sectionId,
      teacherId,
      isPrimary = true,
      effectiveFrom,
      notes,
      overrideWarnings = false,
    } = body

    // Validate required fields
    if (!academicYearId || !teacherId) {
      return NextResponse.json(
        { success: false, message: 'Academic year and teacher are required' },
        { status: 400 }
      )
    }

    // Either academicUnitId or (classId + optional sectionId) must be provided
    if (!academicUnitId && !classId) {
      return NextResponse.json(
        { success: false, message: 'Class selection is required' },
        { status: 400 }
      )
    }

    // Determine the actual academicUnitId to use
    // If sectionId is provided, use it; otherwise use classId; otherwise use academicUnitId
    const effectiveAcademicUnitId = sectionId || classId || academicUnitId

    // Fetch class and section names for denormalization
    let className: string | null = null
    let sectionName: string | null = null

    if (classId) {
      const classUnit = await prisma.academicUnit.findUnique({
        where: { id: classId },
        select: { name: true }
      })
      className = classUnit?.name || null
    }

    if (sectionId) {
      const sectionUnit = await prisma.academicUnit.findUnique({
        where: { id: sectionId },
        select: { name: true }
      })
      sectionName = sectionUnit?.name || null
    }

    // Validate the assignment
    const validation = await validateClassTeacherAssignment({
      schoolId: session.user.schoolId,
      academicYearId,
      academicUnitId: effectiveAcademicUnitId,
      teacherId,
      isPrimary,
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

    // If there's an existing co-class teacher and we're assigning a new one, deactivate old
    if (!isPrimary) {
      await prisma.classTeacher.updateMany({
        where: {
          academicUnitId: effectiveAcademicUnitId,
          academicYearId,
          isPrimary: false,
          isActive: true,
        },
        data: {
          isActive: false,
          effectiveTo: new Date(),
        },
      })
    }

    // Create the class teacher assignment
    const classTeacher = await prisma.classTeacher.create({
      data: {
        schoolId: session.user.schoolId,
        academicYearId,
        academicUnitId: effectiveAcademicUnitId,
        classId: classId || null,
        sectionId: sectionId || null,
        className,
        sectionName,
        teacherId,
        isPrimary,
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
        academicUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log the creation
    await logCreation(ASSIGNMENT_CATEGORY.CLASS_TEACHER, {
      schoolId: session.user.schoolId,
      assignmentId: classTeacher.id,
      data: classTeacher as unknown as Record<string, unknown>,
      changedBy: session.user.id,
    })

    return NextResponse.json({
      success: true,
      message: `${classTeacher.teacher.fullName} assigned as ${isPrimary ? 'class teacher' : 'co-class teacher'} for ${classTeacher.academicUnit.name}`,
      data: classTeacher,
    })
  } catch (error: unknown) {
    console.error('Error creating class teacher assignment:', error)
    
    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'This class already has a class teacher assigned' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create class teacher assignment' },
      { status: 500 }
    )
  }
}
