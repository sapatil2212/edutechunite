import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getJWTUser } from '@/lib/jwt'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// POST: Evaluate a submission
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SCHOOL_ADMIN and TEACHER can evaluate
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id: assignmentId } = params

    // Get teacher profile
    let teacherId: string | null = null
    if (user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: user.id },
      })
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
      }
      teacherId = teacher.id
    } else {
      // For admin, use first available teacher or specified one
      if (body.evaluatedById) {
        teacherId = body.evaluatedById
      } else {
        const teacher = await prisma.teacher.findFirst({
          where: { schoolId: user.schoolId },
        })
        if (teacher) teacherId = teacher.id
      }
    }

    if (!teacherId) {
      return NextResponse.json({ error: 'Evaluator ID required' }, { status: 400 })
    }

    // Verify assignment exists
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        schoolId: user.schoolId,
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const { submissionId, marksObtained, feedback, status = 'EVALUATED', evaluatedAttachments } = body

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    // Verify submission exists and belongs to this assignment
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        assignmentId,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Validate marks
    if (marksObtained !== undefined && marksObtained !== null) {
      if (assignment.maxMarks && marksObtained > assignment.maxMarks) {
        return NextResponse.json({
          error: `Marks cannot exceed maximum marks (${assignment.maxMarks})`,
        }, { status: 400 })
      }
      if (marksObtained < 0) {
        return NextResponse.json({ error: 'Marks cannot be negative' }, { status: 400 })
      }
    }

    // Create or update evaluation
    const evaluation = await prisma.$transaction(async (tx) => {
      // Check if evaluation already exists
      const existingEvaluation = await tx.assignmentEvaluation.findUnique({
        where: { submissionId },
      })

      let newEvaluation

      if (existingEvaluation) {
        // Update existing evaluation
        newEvaluation = await tx.assignmentEvaluation.update({
          where: { id: existingEvaluation.id },
          data: {
            marksObtained: marksObtained !== undefined ? parseFloat(marksObtained) : existingEvaluation.marksObtained,
            feedback: feedback !== undefined ? feedback : existingEvaluation.feedback,
            status,
            evaluatedAt: status === 'EVALUATED' ? new Date() : existingEvaluation.evaluatedAt,
            evaluatedById: teacherId!,
            evaluatedAttachments: evaluatedAttachments || existingEvaluation.evaluatedAttachments,
          },
          include: {
            evaluatedBy: {
              select: { id: true, fullName: true },
            },
          },
        })
      } else {
        // Create new evaluation
        newEvaluation = await tx.assignmentEvaluation.create({
          data: {
            submissionId,
            evaluatedById: teacherId!,
            marksObtained: marksObtained !== undefined ? parseFloat(marksObtained) : null,
            feedback: feedback || null,
            status,
            evaluatedAt: status === 'EVALUATED' ? new Date() : null,
            evaluatedAttachments: evaluatedAttachments || null,
          },
          include: {
            evaluatedBy: {
              select: { id: true, fullName: true },
            },
          },
        })
      }

      // Update submission status
      const submissionStatus = status === 'RETURNED' ? 'RETURNED' : 'EVALUATED'
      await tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: { status: submissionStatus },
      })

      return newEvaluation
    }, {
      maxWait: 5000, // Wait max 5s for transaction to start
      timeout: 10000 // Allow 10s for transaction to complete
    })

    return NextResponse.json({
      evaluation,
      message: status === 'RETURNED' ? 'Submission returned for revision' : 'Evaluation saved successfully',
    })
  } catch (error) {
    console.error('Error evaluating submission:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate submission' },
      { status: 500 }
    )
  }
}

// GET: Get evaluation for a submission
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assignmentId } = params
    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    // Verify assignment exists
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        schoolId: user.schoolId,
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const evaluation = await prisma.assignmentEvaluation.findUnique({
      where: { submissionId },
      include: {
        evaluatedBy: {
          select: { id: true, fullName: true },
        },
        submission: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                admissionNumber: true,
                rollNumber: true,
              },
            },
            attachments: true,
          },
        },
      },
    })

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 })
    }

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error('Error fetching evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evaluation' },
      { status: 500 }
    )
  }
}
