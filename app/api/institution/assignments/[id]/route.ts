import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getJWTUser } from '@/lib/jwt'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const role = user.role

    // Fetch assignment with details
    const assignment = await prisma.assignment.findUnique({
      where: {
        id,
        schoolId: user.schoolId,
      },
      include: {
        academicUnit: {
          select: { id: true, name: true, type: true },
        },
        section: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
        attachments: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Role-based access control and additional data
    let responseAssignment: any = { ...assignment }

    if (role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: user.id },
        include: { academicUnit: true },
      })

      if (!student) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }

      // Check visibility
      // Allow access if:
      // 1. Assignment is for the student's direct unit (e.g. class or section)
      // 2. Assignment is for the student's section (explicit match)
      // 3. Assignment is for the parent unit (Class) and student is in a child unit (Section) - UNLESS assignment is section-specific (sectionId is set)
      
      const isDirectUnit = assignment.academicUnitId === student.academicUnitId
      const isSectionMatch = assignment.sectionId === student.academicUnitId
      
      let isParentUnitMatch = false
      if (student.academicUnit.parentId) {
        // Student is in a section, check if assignment is for the parent class
        // AND assignment is not restricted to a different section (sectionId should be null)
        isParentUnitMatch = 
          assignment.academicUnitId === student.academicUnit.parentId && 
          assignment.sectionId === null
      }

      const hasAccess = isDirectUnit || isSectionMatch || isParentUnitMatch

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Fetch student's submission
      const submission = await prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId: id,
          studentId: student.id,
        },
        include: {
          attachments: true,
          evaluation: true,
        },
        orderBy: { version: 'desc' }, // Get latest version
      })

      responseAssignment.studentSubmission = submission
    }

    return NextResponse.json({ assignment: responseAssignment })

  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
