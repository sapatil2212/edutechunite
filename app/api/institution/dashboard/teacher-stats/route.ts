import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, addDays, format, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'

/**
 * Helper to get session from cookie or Bearer token
 */
async function getSessionOrToken(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session) return session

  const authHeader = req.headers.get('authorization')
  console.log('Teacher Stats - Auth Header:', authHeader ? 'Present' : 'Missing')
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)
    console.log('Teacher Stats - Token Verification Result:', payload ? 'Success' : 'Failed')
    
    if (payload) {
      return {
        user: {
          id: payload.userId,
          email: payload.email,
          name: payload.fullName,
          role: payload.role,
          schoolId: payload.schoolId,
          teacherId: payload.teacherId,
          institutionId: payload.schoolId,
        }
      }
    }
  }
  return null
}

/**
 * GET /api/institution/dashboard/teacher-stats
 * Get dashboard statistics for the logged-in teacher
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrToken(req)
    
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

    const schoolId = session.user.schoolId

    // 1. Get Teacher's Classes (Class Teacher or Subject Teacher)
    const subjectAssignments = await prisma.teacherClassAssignment.findMany({
      where: {
        teacherId,
        schoolId,
        isActive: true,
      },
      include: {
        academicUnit: {
          include: {
            _count: { select: { students: true } }
          }
        }
      }
    })

    const classTeacherAssignments = await prisma.classTeacher.findMany({
      where: {
        teacherId,
        schoolId,
        isActive: true,
      },
      include: {
        academicUnit: {
          include: {
            _count: { select: { students: true } }
          }
        }
      }
    })

    // Merge unique classes
    const classIds = new Set<string>()
    let totalStudents = 0

    // Process subject assignments
    subjectAssignments.forEach(a => {
      if (!classIds.has(a.academicUnitId)) {
        classIds.add(a.academicUnitId)
        totalStudents += (a.academicUnit._count.students || 0)
      }
    })

    // Process class teacher assignments
    classTeacherAssignments.forEach(a => {
      if (!classIds.has(a.academicUnitId)) {
        classIds.add(a.academicUnitId)
        totalStudents += (a.academicUnit._count.students || 0)
      }
    })

    const totalClasses = classIds.size

    // 2. Get Next Class (from Timetable)
    const now = new Date()
    const currentDay = format(now, 'EEEE').toUpperCase()
    // Map date-fns day to Prisma enum if needed, or assume string match
    
    // Find next slot today
    // Note: This is a simplified query. Real implementation needs robust time comparison.
    // Assuming periodNumber corresponds to time slots roughly.
    
    const nextSlot = await prisma.timetableSlot.findFirst({
      where: {
        teacherId,
        dayOfWeek: currentDay as any,
        isActive: true,
        timetable: { status: 'PUBLISHED' }
      },
      orderBy: { periodNumber: 'asc' },
      include: {
        subject: true,
        timetable: {
          include: {
            academicUnit: true
          }
        }
      }
    })

    const nextClass = nextSlot ? {
      subject: nextSlot.subject?.name || 'Subject',
      class: nextSlot.timetable.academicUnit.name,
      time: `Period ${nextSlot.periodNumber}`, // Replace with actual time lookup if available
      room: nextSlot.roomNumber || 'TBD'
    } : null

    // 3. Weekly Attendance (Mock logic for now as aggregation is complex)
    // In a real app, query Attendance records for the last 7 days for students in teacher's classes
    const weeklyAttendance = [85, 88, 92, 90, 95, 93, 0] // Placeholder

    // 4. Recent Activities (Mock or real notifications)
    const recentActivities = [
      { title: 'New timetable published', time: '2h ago', type: 'info' },
      { title: 'Staff meeting scheduled', time: '5h ago', type: 'meeting' },
    ]

    return NextResponse.json({
      success: true,
      totalClasses,
      totalStudents,
      attendanceRate: 92, // Placeholder
      nextClass,
      weeklyAttendance,
      recentActivities
    })

  } catch (error) {
    console.error('Error fetching teacher stats:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch teacher stats' },
      { status: 500 }
    )
  }
}
