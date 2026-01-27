import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST: Submit homework (for students)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only students can submit homework
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit homework' }, { status: 403 })
    }

    if (!session.user.studentId) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const homeworkId = params.id
    const body = await req.json()
    const { submissionText, attachments } = body

    // Get the homework
    const homework = await prisma.homework.findFirst({
      where: {
        id: homeworkId,
        schoolId: session.user.schoolId,
        status: 'PUBLISHED',
      },
    })

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 })
    }

    // Check if student is in the correct class
    const student = await prisma.student.findUnique({
      where: { id: session.user.studentId },
      select: { academicUnitId: true },
    })

    if (student?.academicUnitId !== homework.academicUnitId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if already submitted
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId: session.user.studentId,
        },
      },
    })

    if (existingSubmission && existingSubmission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Homework already submitted' },
        { status: 400 }
      )
    }

    // Check deadline
    const now = new Date()
    const isLate = now > homework.dueDate
    
    if (isLate && !homework.allowLateSubmission) {
      return NextResponse.json(
        { error: 'Submission deadline has passed' },
        { status: 400 }
      )
    }

    // Create or update submission
    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId: session.user.studentId,
        },
      },
      create: {
        homeworkId,
        studentId: session.user.studentId,
        submissionText,
        attachments,
        status: isLate ? 'LATE_SUBMITTED' : 'SUBMITTED',
        submittedAt: now,
      },
      update: {
        submissionText,
        attachments,
        status: isLate ? 'LATE_SUBMITTED' : 'SUBMITTED',
        submittedAt: now,
      },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Error submitting homework:', error)
    return NextResponse.json(
      { error: 'Failed to submit homework' },
      { status: 500 }
    )
  }
}
