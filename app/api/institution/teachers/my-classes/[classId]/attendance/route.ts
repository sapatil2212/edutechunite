import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ classId: string }>
}

/**
 * GET /api/institution/teachers/my-classes/[classId]/attendance
 * Get today's attendance or for a specific date
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
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get current academic year
    const currentYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: session.user.schoolId,
        isCurrent: true,
      },
    })

    if (!currentYear) {
      return NextResponse.json(
        { success: false, message: 'No active academic year found' },
        { status: 400 }
      )
    }

    // Get students with their attendance for the date
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
        profilePhoto: true,
      },
      orderBy: [
        { rollNumber: 'asc' },
        { firstName: 'asc' },
      ],
    })

    // Get attendance records for the date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        academicUnitId: classId,
        date: new Date(dateStr),
        schoolId: session.user.schoolId,
      },
    })

    // Map attendance to students
    const attendanceMap = new Map(attendanceRecords.map((a: { studentId: string }) => [a.studentId, a]))
    
    const studentsWithAttendance = students.map((student: {
      id: string
      admissionNumber: string
      rollNumber: string | null
      firstName: string
      lastName: string
      fullName: string
      profilePhoto: string | null
    }) => ({
      ...student,
      studentId: student.admissionNumber, // Add studentId alias for UI compatibility
      attendance: attendanceMap.get(student.id) || null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
        students: studentsWithAttendance,
        summary: {
          total: students.length,
          present: attendanceRecords.filter((a: { status: string }) => a.status === 'PRESENT').length,
          absent: attendanceRecords.filter((a: { status: string }) => a.status === 'ABSENT').length,
          late: attendanceRecords.filter((a: { status: string }) => a.status === 'LATE').length,
          excused: attendanceRecords.filter((a: { status: string }) => a.status === 'EXCUSED').length,
          notMarked: students.length - attendanceRecords.length,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/institution/teachers/my-classes/[classId]/attendance
 * Mark attendance for a class
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { classId } = await params
    const body = await req.json()
    const { date, attendance } = body

    if (!date || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Get current academic year for new attendance records
    const currentYear = await prisma.academicYear.findFirst({
      where: {
        schoolId: session.user.schoolId,
        isCurrent: true,
      },
    })

    if (!currentYear) {
      return NextResponse.json(
        { success: false, message: 'No active academic year found' },
        { status: 400 }
      )
    }

    const markedBy = session.user.id
    const attendanceDate = new Date(date)

    // Process each attendance record
    const results = await Promise.all(
      attendance.map(async (record: { studentId: string; status: string; remarks?: string }) => {
        const existing = await prisma.attendance.findFirst({
          where: {
            studentId: record.studentId,
            academicUnitId: classId,
            date: attendanceDate,
            schoolId: session.user.schoolId,
          },
        })

        if (existing) {
          // Update existing record
          return prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              remarks: record.remarks,
              markedBy,
              markedAt: new Date(),
            },
          })
        } else {
          // Create new record
          return prisma.attendance.create({
            data: {
              studentId: record.studentId,
              academicUnitId: classId,
              academicYearId: currentYear.id,
              date: attendanceDate,
              status: record.status,
              remarks: record.remarks,
              markedBy,
              markedAt: new Date(),
              schoolId: session.user.schoolId,
            },
          })
        }
      })
    )

    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${results.length} students`,
      data: { markedCount: results.length },
    })
  } catch (error) {
    console.error('Error marking attendance:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}
