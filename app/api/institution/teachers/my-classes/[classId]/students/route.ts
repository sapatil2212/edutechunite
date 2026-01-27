import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ classId: string }>
}

/**
 * GET /api/institution/teachers/my-classes/[classId]/students
 * Get students in a class for the teacher
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

    const { classId } = await params
    const teacherId = session.user.teacherId || undefined

    // Verify teacher has access to this class
    const hasAccess = await verifyTeacherClassAccess(teacherId, classId, session.user.schoolId)
    
    if (!hasAccess && session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get class info
    const academicUnit = await prisma.academicUnit.findUnique({
      where: { id: classId },
      include: { parent: true },
    })

    if (!academicUnit) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      )
    }

    // Get students in this class
    const students = await prisma.student.findMany({
      where: {
        academicUnitId: classId,
        schoolId: session.user.schoolId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        admissionNumber: true,
        rollNumber: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        profilePhoto: true,
        gender: true,
        dateOfBirth: true,
        status: true,
      },
      orderBy: [
        { rollNumber: 'asc' },
        { firstName: 'asc' },
      ],
    })

    // Transform students to include studentId alias for UI compatibility
    const transformedStudents = students.map((student: {
      id: string
      admissionNumber: string
      rollNumber: string | null
      firstName: string
      lastName: string
      fullName: string
      email: string | null
      phone: string | null
      profilePhoto: string | null
      gender: string | null
      dateOfBirth: Date | null
      status: string
    }) => ({
      ...student,
      studentId: student.admissionNumber, // Add alias for UI compatibility
    }))

    return NextResponse.json({
      success: true,
      data: {
        class: {
          id: academicUnit.id,
          name: academicUnit.parent 
            ? `${academicUnit.parent.name} - ${academicUnit.name}` 
            : academicUnit.name,
          type: academicUnit.type,
        },
        students: transformedStudents,
        totalCount: students.length,
      },
    })
  } catch (error) {
    console.error('Error fetching class students:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

async function verifyTeacherClassAccess(teacherId: string | undefined, classId: string, schoolId: string): Promise<boolean> {
  if (!teacherId) return false

  // Check if teacher is class teacher for this class
  const classTeacher = await prisma.classTeacher.findFirst({
    where: {
      teacherId,
      academicUnitId: classId,
      schoolId,
      isActive: true,
    },
  })

  if (classTeacher) return true

  // Check if teacher teaches any subject in this class
  const subjectAssignment = await prisma.teacherClassAssignment.findFirst({
    where: {
      teacherId,
      academicUnitId: classId,
      schoolId,
      isActive: true,
    },
  })

  return !!subjectAssignment
}
