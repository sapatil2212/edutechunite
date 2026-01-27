import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get student profile for teacher (only if teacher is assigned to student's class)
export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers and admins can access this
    if (!['TEACHER', 'SCHOOL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { studentId } = params

    // Get student with full details
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: session.user.schoolId,
      },
      include: {
        academicYear: {
          select: { id: true, name: true, isCurrent: true },
        },
        academicUnit: {
          select: { 
            id: true, 
            name: true, 
            type: true,
            parent: { select: { id: true, name: true } },
          },
        },
        guardians: {
          include: {
            guardian: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                relationship: true,
                occupation: true,
                organization: true,
                address: true,
                alternatePhone: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            documentType: true,
            name: true,
            fileUrl: true,
            isVerified: true,
          },
        },
        // Include attendance summary
        attendances: {
          where: {
            academicYearId: { not: undefined },
          },
          select: {
            status: true,
            date: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // If teacher, verify they are assigned to this student's class
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
      }

      // Check if teacher is class teacher or subject teacher for this class
      const isClassTeacher = await prisma.classTeacher.findFirst({
        where: {
          teacherId: teacher.id,
          academicUnitId: student.academicUnitId,
          isActive: true,
        },
      })

      const isSubjectTeacher = await prisma.teacherClassAssignment.findFirst({
        where: {
          teacherId: teacher.id,
          academicUnitId: student.academicUnitId,
          isActive: true,
        },
      })

      if (!isClassTeacher && !isSubjectTeacher) {
        return NextResponse.json(
          { error: 'You are not assigned to this student\'s class' },
          { status: 403 }
        )
      }
    }

    // Calculate attendance stats
    interface AttendanceRecord {
      status: string
      date: Date
    }
    const attendanceRecords = student.attendances as AttendanceRecord[]
    const attendanceStats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((a: AttendanceRecord) => a.status === 'PRESENT').length,
      absent: attendanceRecords.filter((a: AttendanceRecord) => a.status === 'ABSENT').length,
      late: attendanceRecords.filter((a: AttendanceRecord) => a.status === 'LATE').length,
      onLeave: attendanceRecords.filter((a: AttendanceRecord) => a.status === 'ON_LEAVE').length,
      percentage: 0,
    }
    attendanceStats.percentage = attendanceStats.total > 0 
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100) 
      : 0

    // Remove raw attendances and add stats
    const { attendances, ...studentData } = student

    return NextResponse.json({
      success: true,
      data: {
        ...studentData,
        attendanceStats,
      },
    })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    )
  }
}

// PATCH - Update student profile (teacher can update limited fields)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers and admins can update
    if (!['TEACHER', 'SCHOOL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { studentId } = params
    const body = await req.json()

    // Get student
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: session.user.schoolId,
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // If teacher, verify they are class teacher for this student's class
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
      }

      // Only class teachers can edit student info
      const isClassTeacher = await prisma.classTeacher.findFirst({
        where: {
          teacherId: teacher.id,
          academicUnitId: student.academicUnitId,
          isActive: true,
        },
      })

      if (!isClassTeacher) {
        return NextResponse.json(
          { error: 'Only class teachers can edit student information' },
          { status: 403 }
        )
      }
    }

    // Fields that teachers can update
    const allowedFields = [
      'firstName',
      'middleName',
      'lastName',
      'email',
      'phone',
      'emergencyContact',
      'address',
      'city',
      'state',
      'pincode',
      'bloodGroup',
      'rollNumber',
      'profilePhoto',
    ]

    // Filter only allowed fields
    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Update fullName if name fields changed
    if (body.firstName || body.middleName !== undefined || body.lastName) {
      const firstName = body.firstName || student.firstName
      const middleName = body.middleName !== undefined ? body.middleName : student.middleName
      const lastName = body.lastName || student.lastName
      updateData.fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      include: {
        academicYear: { select: { id: true, name: true } },
        academicUnit: {
          select: { 
            id: true, 
            name: true,
            parent: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedStudent,
    })
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}
