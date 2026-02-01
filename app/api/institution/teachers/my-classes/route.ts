import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Helper to get session from cookie or Bearer token
 */
async function getSessionOrToken(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session) return session

  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)
    
    if (payload) {
      return {
        user: {
          id: payload.userId,
          email: payload.email,
          name: payload.fullName,
          role: payload.role,
          schoolId: payload.schoolId,
          teacherId: payload.teacherId,
        }
      }
    }
  }
  return null
}

/**
 * GET /api/institution/teachers/my-classes
 * Get classes assigned to the current teacher (as class teacher or subject teacher)
 */
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrToken(req)
    
    console.log('GET /my-classes - Session Email:', session?.user?.email)
    console.log('GET /my-classes - Teacher ID:', session?.user?.teacherId)

    if (!session?.user?.schoolId) {
      console.log('Unauthorized: No schoolId')
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Teachers can only see their own classes
    if (session.user.role === 'TEACHER' && !session.user.teacherId) {
      return NextResponse.json(
        { success: false, message: 'Teacher profile not found' },
        { status: 403 }
      )
    }

    const teacherId = session.user.teacherId

    // Get current academic year
    let currentYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: session.user.schoolId,
        isCurrent: true,
      },
    })
    
    console.log('Current Year (isCurrent):', currentYear?.name)

    // Fallback: If no "isCurrent" year, find one that covers today
    if (!currentYear) {
      const now = new Date()
      currentYear = await prisma.academicYear.findFirst({
        where: {
          schoolId: session.user.schoolId,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      })
      console.log('Current Year (Date fallback):', currentYear?.name)
    }

    // Fallback 2: Any active year (latest created)
    if (!currentYear) {
      currentYear = await prisma.academicYear.findFirst({
        where: {
          schoolId: session.user.schoolId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      console.log('Current Year (Latest fallback):', currentYear?.name)
    }

    // Force "2026-2027" if nothing else found (Emergency Fix for debugging)
    if (!currentYear) {
      currentYear = await prisma.academicYear.findFirst({
        where: { name: '2026-2027', schoolId: session.user.schoolId }
      })
      console.log('Current Year (Hard fallback):', currentYear?.name)
    }

    if (!currentYear) {
      console.log('No Academic Year Found for school:', session.user.schoolId)
      return NextResponse.json({
        success: true,
        data: { classTeacherClasses: [], subjectTeacherClasses: [] },
      })
    }

    // Get classes where teacher is class teacher
    const classTeacherAssignments = await prisma.classTeacher.findMany({
      where: {
        teacherId,
        academicYearId: currentYear.id,
        isActive: true,
      },
      include: {
        academicUnit: {
          include: {
            parent: true,
            _count: {
              select: { students: true },
            },
          },
        },
      },
    })
    console.log(`Found ${classTeacherAssignments.length} Class Assignments`)

    // Get classes where teacher teaches subjects
    const subjectAssignments = await prisma.teacherClassAssignment.findMany({
      where: {
        teacherId,
        academicYearId: currentYear.id,
        isActive: true,
      },
      include: {
        subject: true,
        academicUnit: {
          include: {
            parent: true,
            _count: {
              select: { students: true },
            },
          },
        },
      },
    })

    // Format class teacher classes
    const classTeacherClasses = classTeacherAssignments.map((ct) => ({
      id: ct.academicUnit.id,
      name: ct.academicUnit.parent 
        ? `${ct.academicUnit.parent.name} - ${ct.academicUnit.name}` 
        : ct.academicUnit.name,
      type: ct.academicUnit.type,
      isPrimary: ct.isPrimary,
      studentCount: ct.academicUnit._count.students,
      role: 'CLASS_TEACHER' as const,
    }))

    // Group subject assignments by class
    const subjectsByClass = new Map<string, {
      id: string
      name: string
      type: string
      studentCount: number
      subjects: { id: string; name: string; code: string; color: string | null }[]
    }>()

    subjectAssignments.forEach((sa) => {
      const classId = sa.academicUnit.id
      if (!subjectsByClass.has(classId)) {
        subjectsByClass.set(classId, {
          id: classId,
          name: sa.academicUnit.parent 
            ? `${sa.academicUnit.parent.name} - ${sa.academicUnit.name}` 
            : sa.academicUnit.name,
          type: sa.academicUnit.type,
          studentCount: sa.academicUnit._count.students,
          subjects: [],
        })
      }
      subjectsByClass.get(classId)!.subjects.push({
        id: sa.subject.id,
        name: sa.subject.name,
        code: sa.subject.code,
        color: sa.subject.color,
      })
    })

    const subjectTeacherClasses = Array.from(subjectsByClass.values()).map((c) => ({
      ...c,
      role: 'SUBJECT_TEACHER' as const,
    }))

    return NextResponse.json({
      success: true,
      data: {
        classTeacherClasses,
        subjectTeacherClasses,
        academicYear: currentYear.name,
      },
    })
  } catch (error) {
    console.error('Error fetching teacher classes:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}
