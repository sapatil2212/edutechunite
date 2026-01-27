import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/institution/teachers/subjects
 * Get all subjects assigned to the current teacher
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

    const teacherId = session.user.teacherId
    if (!teacherId && session.user.role === 'TEACHER') {
      return NextResponse.json(
        { success: false, message: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    // Get subject assignments for the teacher
    const assignments = await prisma.teacherClassAssignment.findMany({
      where: {
        teacherId,
        schoolId: session.user.schoolId,
        isActive: true,
      },
      include: {
        subject: true,
        academicUnit: {
          include: {
            parent: true
          }
        }
      },
    })

    // Group by subject
    const subjectsMap = new Map<string, any>()

    assignments.forEach(a => {
      if (!subjectsMap.has(a.subjectId)) {
        subjectsMap.set(a.subjectId, {
          ...a.subject,
          classes: []
        })
      }
      subjectsMap.get(a.subjectId).classes.push({
        id: a.academicUnit.id,
        name: a.academicUnit.parent 
          ? `${a.academicUnit.parent.name} - ${a.academicUnit.name}`
          : a.academicUnit.name,
      })
    })

    return NextResponse.json({
      success: true,
      data: Array.from(subjectsMap.values()),
    })
  } catch (error) {
    console.error('Error fetching teacher subjects:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subjects' },
      { status: 500 }
    )
  }
}
