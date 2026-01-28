import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Fetch dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schoolId = session.user.schoolId

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: {
        schoolId,
        isCurrent: true,
      },
    })

    // Get date ranges for comparison
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch all statistics in parallel
    const [
      totalStudents,
      lastMonthStudents,
      activeCourses,
      lastMonthCourses,
      monthlyRevenue,
      lastMonthRevenue,
      attendanceData,
      lastMonthAttendanceData,
    ] = await Promise.all([
      // Total active students
      prisma.student.count({
        where: {
          schoolId,
          status: 'ACTIVE',
        },
      }),
      
      // Students count from last month
      prisma.student.count({
        where: {
          schoolId,
          status: 'ACTIVE',
          createdAt: {
            lt: firstDayOfMonth,
          },
        },
      }),

      // Active courses
      prisma.course.count({
        where: {
          schoolId,
          status: 'ACTIVE',
        },
      }),

      // Courses count from last month
      prisma.course.count({
        where: {
          schoolId,
          status: 'ACTIVE',
          createdAt: {
            lt: firstDayOfMonth,
          },
        },
      }),

      // Monthly revenue (current month) - sum of payments
      (async () => {
        try {
          return await prisma.payment.aggregate({
            where: {
              studentFee: {
                schoolId,
              },
              paidAt: {
                gte: firstDayOfMonth,
                lte: now,
              },
            },
            _sum: {
              amount: true,
            },
          })
        } catch (error) {
          console.log('Payment aggregate not available')
          return { _sum: { amount: 0 } }
        }
      })(),

      // Last month revenue
      (async () => {
        try {
          return await prisma.payment.aggregate({
            where: {
              studentFee: {
                schoolId,
              },
              paidAt: {
                gte: firstDayOfLastMonth,
                lte: lastDayOfLastMonth,
              },
            },
            _sum: {
              amount: true,
            },
          })
        } catch (error) {
          console.log('Payment aggregate not available')
          return { _sum: { amount: 0 } }
        }
      })(),

      // Current month attendance data
      currentAcademicYear
        ? prisma.attendance.findMany({
            where: {
              schoolId,
              academicYearId: currentAcademicYear.id,
              date: {
                gte: firstDayOfMonth,
                lte: now,
              },
            },
            select: {
              status: true,
            },
          })
        : Promise.resolve([]),

      // Last month attendance data
      currentAcademicYear
        ? prisma.attendance.findMany({
            where: {
              schoolId,
              academicYearId: currentAcademicYear.id,
              date: {
                gte: firstDayOfLastMonth,
                lte: lastDayOfLastMonth,
              },
            },
            select: {
              status: true,
            },
          })
        : Promise.resolve([]),
    ])

    // Calculate attendance rate
    const presentCount = attendanceData.filter((a) => a.status === 'PRESENT').length
    const totalAttendance = attendanceData.length
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0

    const lastMonthPresentCount = lastMonthAttendanceData.filter((a) => a.status === 'PRESENT').length
    const lastMonthTotalAttendance = lastMonthAttendanceData.length
    const lastMonthAttendanceRate = lastMonthTotalAttendance > 0 
      ? (lastMonthPresentCount / lastMonthTotalAttendance) * 100 
      : 0

    // Calculate percentage changes
    const studentsChange = lastMonthStudents > 0
      ? ((totalStudents - lastMonthStudents) / lastMonthStudents) * 100
      : 0

    const coursesChange = lastMonthCourses > 0
      ? ((activeCourses - lastMonthCourses) / lastMonthCourses) * 100
      : 0

    const currentRevenue = monthlyRevenue._sum?.amount || 0
    const previousRevenue = lastMonthRevenue._sum?.amount || 0
    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    const attendanceChange = attendanceRate - lastMonthAttendanceRate

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount)
    }

    // Format percentage
    const formatPercentage = (value: number) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
    }

    return NextResponse.json({
      stats: {
        totalStudents: {
          value: totalStudents,
          change: formatPercentage(studentsChange),
          trend: studentsChange >= 0 ? 'up' : 'down',
        },
        activeCourses: {
          value: activeCourses,
          change: formatPercentage(coursesChange),
          trend: coursesChange >= 0 ? 'up' : 'down',
        },
        monthlyRevenue: {
          value: formatCurrency(currentRevenue),
          change: formatPercentage(revenueChange),
          trend: revenueChange >= 0 ? 'up' : 'down',
          rawValue: currentRevenue,
        },
        attendanceRate: {
          value: `${attendanceRate.toFixed(1)}%`,
          change: `${attendanceChange >= 0 ? '+' : ''}${attendanceChange.toFixed(1)}%`,
          trend: attendanceChange >= 0 ? 'up' : 'down',
          rawValue: attendanceRate,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
