import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getJWTUser } from '@/lib/jwt'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Get attendance records
export async function GET(req: NextRequest) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const academicUnitId = searchParams.get('academicUnitId')
    const academicYearId = searchParams.get('academicYearId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const month = searchParams.get('month') // Format: YYYY-MM

    // Build where clause
    const where: any = {
      schoolId: user.schoolId,
    }

    // Student access control
    if (user.role === 'STUDENT') {
      if (!user.studentId) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }
      where.studentId = user.studentId
    } else if (user.role === 'PARENT') {
      // Get linked students for parent
      const linkedStudents = await prisma.studentGuardian.findMany({
        where: {
          guardian: {
            userId: user.id,
          },
        },
        select: { studentId: true },
      })
      const studentIds = linkedStudents.map(s => s.studentId)
      
      if (studentId && studentIds.includes(studentId)) {
        where.studentId = studentId
      } else {
        where.studentId = { in: studentIds }
      }
    } else if (studentId) {
      where.studentId = studentId
    }

    if (academicUnitId) {
      where.academicUnitId = academicUnitId
    }

    if (academicYearId) {
      where.academicYearId = academicYearId
    }

    if (date) {
      where.date = new Date(date)
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const start = new Date(year, monthNum - 1, 1)
      const end = new Date(year, monthNum, 0)
      where.date = {
        gte: start,
        lte: end,
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
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
      orderBy: [
        { date: 'desc' },
        { periodNumber: 'asc' },
      ],
    })

    // Calculate summary if student-specific
    let summary = null
    if (studentId || user.role === 'STUDENT') {
      const targetStudentId = studentId || user.studentId
      const totalDays = attendances.filter(a => a.periodNumber === null).length
      const presentDays = attendances.filter(
        a => a.periodNumber === null && a.status === 'PRESENT'
      ).length
      const absentDays = attendances.filter(
        a => a.periodNumber === null && a.status === 'ABSENT'
      ).length
      const lateDays = attendances.filter(
        a => a.periodNumber === null && a.status === 'LATE'
      ).length
      const leaveDays = attendances.filter(
        a => a.periodNumber === null && a.status === 'ON_LEAVE'
      ).length

      summary = {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        percentage: totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(1) : '0',
      }
    }

    return NextResponse.json({ attendances, summary })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

// POST: Mark attendance (for teachers/admins)
export async function POST(req: NextRequest) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers and admins can mark attendance
    if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      academicYearId,
      academicUnitId,
      date,
      periodNumber, // Optional for period-wise attendance
      subjectId,    // Optional for period-wise attendance
      attendanceRecords, // Array of {studentId, status, remarks}
    } = body

    if (!academicYearId || !academicUnitId || !date || !attendanceRecords?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const attendanceDate = new Date(date)

    // Check if attendance already exists for this date/period
    const existing = await prisma.attendance.findMany({
      where: {
        schoolId: user.schoolId!,
        academicUnitId,
        date: attendanceDate,
        periodNumber: periodNumber ?? null,
      },
    })

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Attendance already marked for this date/period' },
        { status: 400 }
      )
    }

    // Create attendance records in transaction
    const results = await prisma.$transaction(async (tx) => {
      const created = []

      for (const record of attendanceRecords) {
        const attendance = await tx.attendance.create({
          data: {
            schoolId: user.schoolId!,
            studentId: record.studentId,
            academicYearId,
            academicUnitId,
            date: attendanceDate,
            status: record.status || 'PRESENT',
            periodNumber: periodNumber ?? null,
            subjectId: subjectId ?? null,
            remarks: record.remarks ?? null,
            markedBy: user.id,
          },
        })
        created.push(attendance)
      }

      return created
    })

    return NextResponse.json({ 
      message: 'Attendance marked successfully',
      count: results.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Error marking attendance:', error)
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}

// PUT: Update attendance
export async function PUT(req: NextRequest) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers and admins can update attendance
    if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { attendanceId, status, remarks } = body

    if (!attendanceId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status,
        remarks,
        markedBy: user.id,
        markedAt: new Date(),
      },
    })

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}
