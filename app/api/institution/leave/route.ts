import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId') || session.user.studentId

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID not found' }, { status: 400 })
    }

    // Security check for parents
    if (session.user.role === 'PARENT') {
      const isLinked = await prisma.studentGuardian.findFirst({
        where: {
          studentId,
          guardian: { userId: session.user.id }
        }
      })
      if (!isLinked) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        studentId,
        schoolId: session.user.schoolId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ leaveRequests })
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { studentId, startDate, endDate, reason, leaveType, attachmentUrl } = body

    if (!studentId || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Security check
    if (session.user.role === 'STUDENT' && session.user.studentId !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (session.user.role === 'PARENT') {
      const isLinked = await prisma.studentGuardian.findFirst({
        where: {
          studentId,
          guardian: { userId: session.user.id }
        }
      })
      if (!isLinked) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        schoolId: session.user.schoolId!,
        studentId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        leaveType,
        attachmentUrl,
        submittedBy: session.user.id,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ success: true, leaveRequest })
  } catch (error) {
    console.error('Error creating leave request:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
