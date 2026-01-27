import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET: Get all submissions for an assignment
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assignmentId } = params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Verify assignment exists and user has access
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        schoolId: session.user.schoolId,
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      assignmentId,
    }

    if (status) {
      where.status = status
    }

    // Get submissions with student details
    const submissions = await prisma.assignmentSubmission.findMany({
      where,
      select: {
        id: true,
        status: true,
        isLate: true,
        submittedAt: true,
        remarks: true,
        version: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
            profilePhoto: true,
          },
        },
        attachments: {
          select: {
            id: true,
            url: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
          },
        },
        evaluation: {
          select: {
            id: true,
            marksObtained: true,
            feedback: true,
            status: true,
            evaluatedAt: true,
            evaluatedBy: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
      orderBy: [
        { submittedAt: 'desc' },
        { student: { fullName: 'asc' } },
      ],
      skip,
      take: limit,
    })

    const total = await prisma.assignmentSubmission.count({ where })

    // Get summary stats
    const stats = await prisma.assignmentSubmission.groupBy({
      by: ['status'],
      where: { assignmentId },
      _count: { status: true },
    })

    const summary = {
      total: 0,
      pending: 0,
      submitted: 0,
      late: 0,
      evaluated: 0,
      returned: 0,
    }

    stats.forEach((s) => {
      summary.total += s._count.status
      const statusKey = s.status.toLowerCase() as keyof typeof summary
      if (statusKey in summary) {
        summary[statusKey] = s._count.status
      }
    })

    return NextResponse.json({
      submissions,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// POST: Submit assignment (student)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assignmentId } = params

    // Get student profile
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Get assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        schoolId: session.user.schoolId,
        status: 'PUBLISHED',
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or not published' }, { status: 404 })
    }

    // Check if submission mode allows online submission
    if (assignment.submissionMode === 'OFFLINE') {
      return NextResponse.json({ error: 'This assignment does not accept online submissions' }, { status: 400 })
    }

    const body = await req.json()
    const { remarks, attachments = [] } = body

    // Check due date
    const now = new Date()
    const dueDateTime = new Date(assignment.dueDate)
    if (assignment.dueTime) {
      const [hours, minutes] = assignment.dueTime.split(':').map(Number)
      dueDateTime.setHours(hours, minutes, 59, 999)
    } else {
      dueDateTime.setHours(23, 59, 59, 999)
    }

    const isLate = now > dueDateTime

    // Check if late submission is allowed
    if (isLate && !assignment.allowLateSubmission) {
      return NextResponse.json({ error: 'Late submissions are not allowed for this assignment' }, { status: 400 })
    }

    // Check for existing submission
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: student.id,
      },
      orderBy: { version: 'desc' },
    })

    if (existingSubmission) {
      // Check if resubmission is allowed
      if (existingSubmission.status !== 'PENDING' && existingSubmission.status !== 'RETURNED') {
        if (!assignment.allowResubmission) {
          return NextResponse.json({ error: 'Resubmission is not allowed for this assignment' }, { status: 400 })
        }

        // Check resubmission deadline if set
        if (assignment.resubmissionDeadline && now > assignment.resubmissionDeadline) {
          return NextResponse.json({ error: 'Resubmission deadline has passed' }, { status: 400 })
        }
      }
    }

    // Create or update submission
    const submission = await prisma.$transaction(async (tx) => {
      let newSubmission

      if (existingSubmission && existingSubmission.status === 'PENDING') {
        // Update existing pending submission
        newSubmission = await tx.assignmentSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            status: isLate ? 'LATE' : 'SUBMITTED',
            isLate,
            submittedAt: now,
            remarks,
          },
          include: {
            student: {
              select: { id: true, fullName: true },
            },
          },
        })

        // Delete old attachments
        await tx.submissionAttachment.deleteMany({
          where: { submissionId: existingSubmission.id },
        })
      } else if (existingSubmission && assignment.allowResubmission) {
        // Create new version for resubmission
        newSubmission = await tx.assignmentSubmission.create({
          data: {
            assignmentId,
            studentId: student.id,
            status: isLate ? 'LATE' : 'SUBMITTED',
            isLate,
            submittedAt: now,
            remarks,
            version: existingSubmission.version + 1,
            previousSubmissionId: existingSubmission.id,
          },
          include: {
            student: {
              select: { id: true, fullName: true },
            },
          },
        })
      } else {
        // Create new submission
        newSubmission = await tx.assignmentSubmission.create({
          data: {
            assignmentId,
            studentId: student.id,
            status: isLate ? 'LATE' : 'SUBMITTED',
            isLate,
            submittedAt: now,
            remarks,
          },
          include: {
            student: {
              select: { id: true, fullName: true },
            },
          },
        })
      }

      // Add attachments
      if (attachments && attachments.length > 0) {
        await tx.submissionAttachment.createMany({
          data: attachments.map((attachment: any) => ({
            submissionId: newSubmission.id,
            url: attachment.url,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
          })),
        })
      }

      return newSubmission
    })

    return NextResponse.json({
      submission,
      message: isLate ? 'Assignment submitted (late)' : 'Assignment submitted successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    )
  }
}
