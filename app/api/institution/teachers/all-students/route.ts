import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/institution/teachers/all-students
 * Get all students across all classes assigned to the teacher
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

    const teacherId = session.user.teacherId || undefined
    if (!teacherId && session.user.role === 'TEACHER') {
      return NextResponse.json(
        { success: false, message: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    // 1. Get all assigned class IDs for this teacher
    const classTeacherUnits = await prisma.classTeacher.findMany({
      where: {
        teacherId,
        schoolId: session.user.schoolId,
        isActive: true,
      },
      select: { academicUnitId: true }
    })

    const subjectTeacherUnits = await prisma.teacherClassAssignment.findMany({
      where: {
        teacherId,
        schoolId: session.user.schoolId,
        isActive: true,
      },
      select: { academicUnitId: true }
    })

    const classIds = Array.from(new Set([
      ...classTeacherUnits.map(u => u.academicUnitId),
      ...subjectTeacherUnits.map(u => u.academicUnitId)
    ]))

    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          students: [],
          totalCount: 0
        }
      })
    }

    // 2. Get students in these classes
    const students = await prisma.student.findMany({
      where: {
        academicUnitId: { in: classIds },
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
        academicUnit: {
          select: {
            id: true,
            name: true,
            parent: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: [
        { academicUnit: { name: 'asc' } },
        { rollNumber: 'asc' },
        { firstName: 'asc' },
      ],
    })

    const transformedStudents = students.map(student => ({
      ...student,
      className: student.academicUnit.parent 
        ? `${student.academicUnit.parent.name} - ${student.academicUnit.name}`
        : student.academicUnit.name
    }))

    return NextResponse.json({
      success: true,
      data: {
        students: transformedStudents,
        totalCount: students.length,
      },
    })
  } catch (error) {
    console.error('Error fetching all students for teacher:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}
