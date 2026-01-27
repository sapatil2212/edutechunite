import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET: Get exams and results
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId')
    const examType = searchParams.get('examType')
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'

    // Build where clause
    const where: any = {
      schoolId: session.user.schoolId,
    }

    if (academicYearId) {
      where.academicYearId = academicYearId
    }

    if (examType) {
      where.examType = examType
    }

    if (status) {
      where.status = status
    }

    if (upcoming) {
      where.startDate = { gte: new Date() }
      where.status = { in: ['SCHEDULED', 'ONGOING'] }
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        academicYear: {
          select: { id: true, name: true },
        },
        schedules: {
          include: {
            subject: {
              select: { id: true, name: true, code: true },
            },
            academicUnit: {
              select: { id: true, name: true },
            },
          },
          orderBy: { examDate: 'asc' },
        },
        _count: {
          select: { results: true },
        },
      },
      orderBy: [
        { startDate: 'desc' },
      ],
    })

    return NextResponse.json({ exams })
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}

// POST: Create exam (for admins)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      description,
      examType,
      academicYearId,
      startDate,
      endDate,
      gradingSystem,
      showRank,
      showPercentage,
      showGrade,
      schedules, // Array of schedule items
    } = body

    if (!name || !academicYearId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const exam = await prisma.$transaction(async (tx) => {
      // Create the exam
      const newExam = await tx.exam.create({
        data: {
          schoolId: session.user.schoolId!,
          name,
          description,
          examType: examType || 'MID_TERM',
          academicYearId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          gradingSystem,
          showRank: showRank ?? false,
          showPercentage: showPercentage ?? true,
          showGrade: showGrade ?? true,
          status: 'SCHEDULED',
        },
      })

      // Create schedules if provided
      if (schedules && Array.isArray(schedules) && schedules.length > 0) {
        for (const schedule of schedules) {
          await tx.examSchedule.create({
            data: {
              examId: newExam.id,
              subjectId: schedule.subjectId,
              academicUnitId: schedule.academicUnitId,
              examDate: new Date(schedule.examDate),
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              duration: schedule.duration,
              room: schedule.room,
              maxMarks: schedule.maxMarks || 100,
              passingMarks: schedule.passingMarks || 33,
            },
          })
        }
      }

      return newExam
    })

    const examWithSchedules = await prisma.exam.findUnique({
      where: { id: exam.id },
      include: {
        schedules: {
          include: {
            subject: true,
            academicUnit: true,
          },
        },
      },
    })

    return NextResponse.json({ exam: examWithSchedules }, { status: 201 })
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    )
  }
}
