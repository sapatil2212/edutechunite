import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET: Get single assignment
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
      include: {
        academicYear: {
          select: { id: true, name: true },
        },
        academicUnit: {
          select: { id: true, name: true, type: true },
        },
        section: {
          select: { id: true, name: true },
        },
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        attachments: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get submission stats
    const totalStudents = await prisma.student.count({
      where: {
        academicUnitId: assignment.sectionId || assignment.academicUnitId,
        status: 'ACTIVE',
      },
    })

    const submissionStats = await prisma.assignmentSubmission.groupBy({
      by: ['status'],
      where: { assignmentId: id },
      _count: { status: true },
    })

    const stats = {
      totalStudents,
      submitted: 0,
      late: 0,
      evaluated: 0,
      pending: 0,
    }

    submissionStats.forEach((s) => {
      if (s.status === 'SUBMITTED') stats.submitted = s._count.status
      if (s.status === 'LATE') stats.late = s._count.status
      if (s.status === 'EVALUATED') stats.evaluated = s._count.status
      if (s.status === 'PENDING') stats.pending = s._count.status
    })

    // If student, include their submission
    let studentSubmission = null
    if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
      })
      if (student) {
        studentSubmission = await prisma.assignmentSubmission.findFirst({
          where: {
            assignmentId: id,
            studentId: student.id,
          },
          include: {
            attachments: true,
            evaluation: true,
          },
          orderBy: { version: 'desc' },
        })
      }
    }

    return NextResponse.json({
      assignment: {
        ...assignment,
        stats,
        studentSubmission,
      },
    })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    )
  }
}

// PUT: Update assignment
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SCHOOL_ADMIN, SUPER_ADMIN, and TEACHER can update assignments
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params

    // Check if assignment exists and belongs to this school
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
      include: {
        createdBy: true,
      },
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Teachers can only edit their own assignments
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      })
      if (!teacher || existingAssignment.createdById !== teacher.id) {
        return NextResponse.json({ error: 'You can only edit your own assignments' }, { status: 403 })
      }
    }

    const body = await req.json()
    const {
      title,
      description,
      instructions,
      academicUnitId,
      sectionId,
      subjectId,
      type,
      category,
      submissionMode,
      maxMarks,
      dueDate,
      dueTime,
      status,
      scheduledFor,
      allowLateSubmission,
      allowResubmission,
      resubmissionDeadline,
      attachments,
    } = body

    // Build update data
    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (instructions !== undefined) updateData.instructions = instructions
    if (academicUnitId !== undefined) updateData.academicUnitId = academicUnitId
    if (sectionId !== undefined) updateData.sectionId = sectionId || null
    if (subjectId !== undefined) updateData.subjectId = subjectId || null
    if (type !== undefined) updateData.type = type
    if (category !== undefined) updateData.category = category
    if (submissionMode !== undefined) updateData.submissionMode = submissionMode
    if (maxMarks !== undefined) updateData.maxMarks = maxMarks ? parseInt(maxMarks) : null
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (dueTime !== undefined) updateData.dueTime = dueTime || null
    if (allowLateSubmission !== undefined) updateData.allowLateSubmission = allowLateSubmission
    if (allowResubmission !== undefined) updateData.allowResubmission = allowResubmission
    if (resubmissionDeadline !== undefined) {
      updateData.resubmissionDeadline = resubmissionDeadline ? new Date(resubmissionDeadline) : null
    }

    // Handle status change
    if (status !== undefined) {
      updateData.status = status
      if (status === 'PUBLISHED' && existingAssignment.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date()
      }
      if (scheduledFor !== undefined) {
        updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null
      }
    }

    const assignment = await prisma.$transaction(async (tx) => {
      // Update the assignment
      const updated = await tx.assignment.update({
        where: { id },
        data: updateData,
        include: {
          academicYear: true,
          academicUnit: true,
          section: true,
          subject: true,
          createdBy: true,
          attachments: true,
        },
      })

      // Update attachments if provided
      if (attachments !== undefined) {
        // Delete existing attachments
        await tx.assignmentAttachment.deleteMany({
          where: { assignmentId: id },
        })

        // Create new attachments
        if (attachments.length > 0) {
          await tx.assignmentAttachment.createMany({
            data: attachments.map((attachment: any, index: number) => ({
              assignmentId: id,
              type: attachment.type || 'FILE',
              url: attachment.url,
              fileName: attachment.fileName,
              fileSize: attachment.fileSize,
              mimeType: attachment.mimeType,
              displayOrder: index,
            })),
          })
        }
      }

      // If newly published, create pending submissions
      if (status === 'PUBLISHED' && existingAssignment.status !== 'PUBLISHED') {
        const targetUnitId = updated.sectionId || updated.academicUnitId
        const students = await tx.student.findMany({
          where: {
            academicUnitId: targetUnitId,
            status: 'ACTIVE',
          },
          select: { id: true },
        })

        // Get existing submissions
        const existingSubmissions = await tx.assignmentSubmission.findMany({
          where: { assignmentId: id },
          select: { studentId: true },
        })
        const existingStudentIds = new Set(existingSubmissions.map((s) => s.studentId))

        // Create submissions for students who don't have one
        const newSubmissions = students.filter((s) => !existingStudentIds.has(s.id))
        if (newSubmissions.length > 0) {
          await tx.assignmentSubmission.createMany({
            data: newSubmissions.map((student) => ({
              assignmentId: id,
              studentId: student.id,
              status: 'PENDING',
            })),
          })
        }
      }

      return updated
    })

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

// DELETE: Delete assignment (soft delete - archive)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SCHOOL_ADMIN, SUPER_ADMIN, and TEACHER can delete assignments
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params

    // Check if assignment exists and belongs to this school
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id,
        schoolId: session.user.schoolId,
      },
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Teachers can only delete their own assignments
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      })
      if (!teacher || existingAssignment.createdById !== teacher.id) {
        return NextResponse.json({ error: 'You can only delete your own assignments' }, { status: 403 })
      }
    }

    // Soft delete - change status to ARCHIVED
    await prisma.assignment.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    return NextResponse.json({ success: true, message: 'Assignment archived successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
