import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET: Fetch recent activities
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schoolId = session.user.schoolId
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch recent activities from various sources
    const [
      recentStudents,
      recentAssignments,
      recentPayments,
      recentEnrollments,
    ] = await Promise.all([
      // Recent student enrollments
      prisma.student.findMany({
        where: {
          schoolId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          fullName: true,
          createdAt: true,
          course: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Recent assignment submissions
      prisma.assignmentSubmission.findMany({
        where: {
          assignment: {
            schoolId,
          },
          status: 'SUBMITTED',
        },
        select: {
          id: true,
          submittedAt: true,
          student: {
            select: { fullName: true },
          },
          assignment: {
            select: { title: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      }),

      // Recent payments
      prisma.feePayment.findMany({
        where: {
          studentFee: {
            schoolId,
          },
        },
        select: {
          id: true,
          amount: true,
          paidAt: true,
          studentFee: {
            select: {
              student: {
                select: { fullName: true },
              },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        take: 5,
      }),

      // Recent course completions (homework completed)
      prisma.homeworkSubmission.findMany({
        where: {
          homework: {
            schoolId,
          },
          status: 'EVALUATED',
        },
        select: {
          id: true,
          submittedAt: true,
          student: {
            select: { fullName: true },
          },
          homework: {
            select: { 
              title: true,
              subject: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      }),
    ])

    // Combine and format activities
    const activities: any[] = []

    // Add student enrollments
    recentStudents.forEach((student) => {
      activities.push({
        id: `enrollment-${student.id}`,
        title: 'New student enrollment',
        description: `${student.fullName} enrolled in ${student.course?.name || 'the institution'}`,
        time: student.createdAt,
        type: 'enrollment',
      })
    })

    // Add assignment submissions
    recentAssignments.forEach((submission) => {
      if (submission.student) {
        activities.push({
          id: `assignment-${submission.id}`,
          title: 'Assignment submitted',
          description: `${submission.assignment.title} submitted by ${submission.student.fullName}`,
          time: submission.submittedAt,
          type: 'assignment',
        })
      }
    })

    // Add payments
    recentPayments.forEach((payment) => {
      activities.push({
        id: `payment-${payment.id}`,
        title: 'Payment received',
        description: `Fee payment of ₹${payment.amount.toLocaleString()} from ${payment.studentFee.student.fullName}`,
        time: payment.paidAt,
        type: 'payment',
      })
    })

    // Add homework completions
    recentEnrollments.forEach((submission) => {
      if (submission.submittedAt) {
        activities.push({
          id: `completion-${submission.id}`,
          title: 'Homework completed',
          description: `${submission.student.fullName} completed ${submission.homework.title}`,
          time: submission.submittedAt,
          type: 'completion',
        })
      }
    })

    // Sort by time (most recent first) and limit
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    const limitedActivities = activities.slice(0, limit)

    // Format relative time
    const formatRelativeTime = (date: Date) => {
      const now = new Date()
      const diffMs = now.getTime() - new Date(date).getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      return new Date(date).toLocaleDateString()
    }

    // Add formatted time to activities
    const formattedActivities = limitedActivities.map((activity) => ({
      ...activity,
      time: formatRelativeTime(activity.time),
    }))

    return NextResponse.json({
      activities: formattedActivities,
    })
  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    )
  }
}
