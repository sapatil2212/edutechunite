import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/institution/teachers/my-classes
 * Get classes assigned to the current teacher (as class teacher or subject teacher)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
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
    const currentYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: session.user.schoolId,
        isCurrent: true,
      },
    })

    if (!currentYear) {
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
