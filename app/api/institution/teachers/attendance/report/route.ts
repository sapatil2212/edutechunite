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

export const dynamic = 'force-dynamic'

interface AttendanceRecord {
  id: string
  date: Date
  status: string
}

interface StudentWithAttendance {
  id: string
  firstName: string
  lastName: string
  rollNumber: string | null
  academicUnit?: { name: string } | null
  attendances: AttendanceRecord[]
}

interface AssignmentRecord {
  academicUnitId: string
}

// GET /api/institution/teachers/attendance/report
// Fetches attendance report data for the logged-in teacher's classes
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrToken(request)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({
      where: {
        user: { email: session.user.email },
        isActive: true,
      },
      include: {
        school: true,
      },
    })

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const range = searchParams.get('range') || 'month' // week, month, quarter

    // Calculate date range
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    
    if (range === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (range === 'month') {
      startDate.setDate(startDate.getDate() - 30)
    } else if (range === 'quarter') {
      startDate.setDate(startDate.getDate() - 90)
    }

    // Get teacher's assigned class IDs
    // @ts-ignore - Prisma client needs regeneration
    const classTeacherAssignments: AssignmentRecord[] = await prisma.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
        isActive: true,
      },
      select: { academicUnitId: true },
    }).catch(() => [] as AssignmentRecord[])

    // @ts-ignore - Prisma client needs regeneration
    const subjectAssignments: AssignmentRecord[] = await prisma.teacherClassAssignment.findMany({
      where: {
        teacherId: teacher.id,
        isActive: true,
      },
      select: { academicUnitId: true },
    }).catch(() => [] as AssignmentRecord[])

    let assignedClassIds = [
      ...classTeacherAssignments.map((a: AssignmentRecord) => a.academicUnitId),
      ...subjectAssignments.map((a: AssignmentRecord) => a.academicUnitId),
    ]
    // Remove duplicates
    assignedClassIds = [...new Set(assignedClassIds)]

    // If specific class is selected, filter to just that class
    if (classId && classId !== 'all') {
      if (!assignedClassIds.includes(classId)) {
        return NextResponse.json(
          { success: false, message: 'Not authorized for this class' },
          { status: 403 }
        )
      }
      assignedClassIds = [classId]
    }

    if (assignedClassIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          stats: {
            totalStudents: 0,
            presentToday: 0,
            absentToday: 0,
            lateToday: 0,
            excusedToday: 0,
            averageAttendance: 0,
            monthlyTrend: 0,
          },
          students: [],
          dailyData: [],
        },
      })
    }

    // Get students in assigned classes
    // @ts-ignore - Prisma client needs regeneration
    const students: StudentWithAttendance[] = await prisma.student.findMany({
      where: {
        schoolId: teacher.schoolId,
        academicUnitId: { in: assignedClassIds },
        status: 'ACTIVE',
      },
      include: {
        academicUnit: true,
        attendances: {
          where: {
            date: {
              gte: startDate,
              lte: today,
            },
          },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: [
        { academicUnit: { name: 'asc' } },
        { rollNumber: 'asc' },
        { firstName: 'asc' },
      ],
    })

    const totalStudents = students.length

    // Calculate today's stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    let presentToday = 0
    let absentToday = 0
    let lateToday = 0
    let excusedToday = 0

    students.forEach((student: StudentWithAttendance) => {
      const todayAttendance = student.attendances.find(
        (a: AttendanceRecord) => new Date(a.date).toDateString() === todayStart.toDateString()
      )
      if (todayAttendance) {
        switch (todayAttendance.status) {
          case 'PRESENT': presentToday++; break
          case 'ABSENT': absentToday++; break
          case 'LATE': lateToday++; break
          case 'EXCUSED': excusedToday++; break
        }
      }
    })

    // Calculate per-student attendance
    const studentData = students.map((student: StudentWithAttendance) => {
      const attendances = student.attendances
      const totalDays = attendances.length
      const present = attendances.filter((a: AttendanceRecord) => a.status === 'PRESENT').length
      const absent = attendances.filter((a: AttendanceRecord) => a.status === 'ABSENT').length
      const late = attendances.filter((a: AttendanceRecord) => a.status === 'LATE').length
      const excused = attendances.filter((a: AttendanceRecord) => a.status === 'EXCUSED').length
      const percentage = totalDays > 0 
        ? Math.round(((present + late) / totalDays) * 1000) / 10  // Present + Late counts as attended
        : 0

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber || '-',
        className: student.academicUnit?.name || '',
        totalDays,
        present,
        absent,
        late,
        excused,
        percentage,
      }
    })

    // Calculate overall average attendance
    const totalAttendanceRecords = studentData.reduce((sum, s) => sum + s.totalDays, 0)
    const totalPresent = studentData.reduce((sum, s) => sum + s.present + s.late, 0)
    const averageAttendance = totalAttendanceRecords > 0
      ? Math.round((totalPresent / totalAttendanceRecords) * 1000) / 10
      : 0

    // Calculate monthly trend (compare current week to previous week)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    // @ts-ignore - Prisma client needs regeneration
    const recentWeekAttendance: AttendanceRecord[] = await prisma.attendance.findMany({
      where: {
        student: {
          schoolId: teacher.schoolId,
          academicUnitId: { in: assignedClassIds },
          status: 'ACTIVE',
        },
        date: { gte: oneWeekAgo, lte: today },
      },
    })

    // @ts-ignore - Prisma client needs regeneration
    const previousWeekAttendance: AttendanceRecord[] = await prisma.attendance.findMany({
      where: {
        student: {
          schoolId: teacher.schoolId,
          academicUnitId: { in: assignedClassIds },
          status: 'ACTIVE',
        },
        date: { gte: twoWeeksAgo, lt: oneWeekAgo },
      },
    })

    const recentRate = recentWeekAttendance.length > 0
      ? (recentWeekAttendance.filter((a: AttendanceRecord) => a.status === 'PRESENT' || a.status === 'LATE').length / recentWeekAttendance.length) * 100
      : 0
    const previousRate = previousWeekAttendance.length > 0
      ? (previousWeekAttendance.filter((a: AttendanceRecord) => a.status === 'PRESENT' || a.status === 'LATE').length / previousWeekAttendance.length) * 100
      : 0
    const monthlyTrend = Math.round((recentRate - previousRate) * 10) / 10

    // Get daily data for the last 7 days
    const dailyData: { date: string; dayName: string; present: number; absent: number; late: number; total: number }[] = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      // @ts-ignore - Prisma client needs regeneration
      const dayAttendance: AttendanceRecord[] = await prisma.attendance.findMany({
        where: {
          student: {
            schoolId: teacher.schoolId,
            academicUnitId: { in: assignedClassIds },
            status: 'ACTIVE',
          },
          date: { gte: date, lte: dayEnd },
        },
      })

      dailyData.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[date.getDay()],
        present: dayAttendance.filter((a: AttendanceRecord) => a.status === 'PRESENT').length,
        absent: dayAttendance.filter((a: AttendanceRecord) => a.status === 'ABSENT').length,
        late: dayAttendance.filter((a: AttendanceRecord) => a.status === 'LATE').length,
        total: dayAttendance.length || totalStudents,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          presentToday,
          absentToday,
          lateToday,
          excusedToday,
          averageAttendance,
          monthlyTrend,
        },
        students: studentData,
        dailyData,
      },
    })
  } catch (error) {
    console.error('Attendance report error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch attendance report' },
      { status: 500 }
    )
  }
}
