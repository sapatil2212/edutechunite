import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getJWTUser } from '@/lib/jwt'
import prisma from '@/lib/prisma'

// GET: List assignments
export async function GET(req: NextRequest) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId')
    const academicUnitId = searchParams.get('academicUnitId')
    const subjectId = searchParams.get('subjectId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const createdById = searchParams.get('createdById')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const role = user.role

    // Build where clause
    const where: any = {
      schoolId: user.schoolId,
    }

    // Role-based filtering
    if (role === 'TEACHER') {
      // Teachers see only their own assignments
      const teacher = await prisma.teacher.findFirst({
        where: { userId: user.id },
      })
      if (teacher) {
        where.createdById = teacher.id
      }
    } else if (role === 'STUDENT') {
      // Students see only published assignments for their class
      const student = await prisma.student.findFirst({
        where: { userId: user.id },
        include: { academicUnit: true },
      })
      if (student) {
        where.status = 'PUBLISHED'
        where.OR = [
          { academicUnitId: student.academicUnitId },
          { sectionId: student.academicUnitId },
        ]
        
        // If student is in a Section (has parentId), also show assignments for the Class (parent)
        // Only if assignment.sectionId is null (meaning it's for the whole class)
        if (student.academicUnit.parentId) {
          where.OR.push({ 
            academicUnitId: student.academicUnit.parentId,
            sectionId: null 
          })
        }
      }
    }

    // Additional filters
    if (academicYearId) {
      where.academicYearId = academicYearId
    }

    if (academicUnitId) {
      where.academicUnitId = academicUnitId
    }

    if (subjectId) {
      where.subjectId = subjectId
    }

    if (status && role !== 'STUDENT') {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (createdById) {
      where.createdById = createdById
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Get total count
    const total = await prisma.assignment.count({ where })

    // Get assignments with pagination
    const assignments = await prisma.assignment.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        category: true,
        submissionMode: true,
        maxMarks: true,
        dueDate: true,
        dueTime: true,
        status: true,
        publishedAt: true,
        scheduledFor: true,
        allowLateSubmission: true,
        allowResubmission: true,
        createdAt: true,
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
          select: { id: true, fullName: true },
        },
        _count: {
          select: {
            submissions: true,
            attachments: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    })

    // For teachers, get submission stats
    let assignmentsWithStats = assignments
    if (role === 'TEACHER' || role === 'SCHOOL_ADMIN') {
      assignmentsWithStats = await Promise.all(
        assignments.map(async (assignment) => {
          // Get total students in the class
          const studentCount = await prisma.student.count({
            where: {
              OR: [
                { academicUnitId: assignment.academicUnit.id },
                ...(assignment.section ? [{ academicUnitId: assignment.section.id }] : []),
              ],
              status: 'ACTIVE',
            },
          })

          // Get submission counts
          const submittedCount = await prisma.assignmentSubmission.count({
            where: {
              assignmentId: assignment.id,
              status: { in: ['SUBMITTED', 'LATE', 'EVALUATED'] },
            },
          })

          const evaluatedCount = await prisma.assignmentSubmission.count({
            where: {
              assignmentId: assignment.id,
              status: 'EVALUATED',
            },
          })

          return {
            ...assignment,
            stats: {
              totalStudents: studentCount,
              submitted: submittedCount,
              evaluated: evaluatedCount,
              pending: studentCount - submittedCount,
              submissionRate: studentCount > 0 ? Math.round((submittedCount / studentCount) * 100) : 0,
            },
          }
        })
      )
    } else if (role === 'STUDENT') {
      // For students, include their submission status
      const student = await prisma.student.findFirst({
        where: { userId: user.id },
      })
      
      if (student) {
        const submissions = await prisma.assignmentSubmission.findMany({
          where: {
            studentId: student.id,
            assignmentId: { in: assignments.map(a => a.id) },
          },
          include: {
            evaluation: true,
          },
        })
        
        const submissionMap = new Map(submissions.map(s => [s.assignmentId, s]))
        
        assignmentsWithStats = assignments.map(assignment => {
          const sub = submissionMap.get(assignment.id)
          if (!sub) return { ...assignment, submission: null }

          return {
            ...assignment,
            submission: {
              ...sub,
              marksObtained: sub.evaluation?.marksObtained || null,
              feedback: sub.evaluation?.feedback || null,
            }
          }
        })
      }
    }

    return NextResponse.json({
      assignments: assignmentsWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST: Create a new assignment
export async function POST(req: NextRequest) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SCHOOL_ADMIN, SUPER_ADMIN, and TEACHER can create assignments
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    
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
      // For admin, they must specify a teacher or we use a default
      if (body.createdById) {
        teacherId = body.createdById
      } else {
        // Get first teacher in the school as fallback
        const teacher = await prisma.teacher.findFirst({
          where: { schoolId: user.schoolId },
        })
        if (teacher) {
          teacherId = teacher.id
        }
      }
    }

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })
    }

    let {
      title,
      description,
      instructions,
      academicYearId,
      academicUnitId,
      sectionId,
      subjectId,
      type = 'HOMEWORK',
      category = 'INDIVIDUAL',
      submissionMode = 'ONLINE',
      maxMarks,
      dueDate,
      dueTime,
      status = 'DRAFT',
      scheduledFor,
      allowLateSubmission = false,
      allowResubmission = false,
      resubmissionDeadline,
      attachments = [],
    } = body

    // Handle "current" academic year
    if (academicYearId === 'current') {
      const currentYear = await prisma.academicYear.findFirst({
        where: {
          schoolId: user.schoolId,
          isCurrent: true,
        },
      })
      if (!currentYear) {
        return NextResponse.json({ error: 'Current academic year not found' }, { status: 404 })
      }
      academicYearId = currentYear.id
    }

    // Validate required fields
    if (!title || !academicYearId || !academicUnitId || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, academicYearId, academicUnitId, and dueDate are required' },
        { status: 400 }
      )
    }

    // Validate academic unit belongs to this school
    const academicUnit = await prisma.academicUnit.findFirst({
      where: {
        id: academicUnitId,
        schoolId: user.schoolId,
      },
    })

    if (!academicUnit) {
      return NextResponse.json({ error: 'Academic unit not found' }, { status: 404 })
    }

    // Create assignment with transaction
    const assignment = await prisma.$transaction(async (tx) => {
      // Create the assignment
      const newAssignment = await tx.assignment.create({
        data: {
          schoolId: user.schoolId!,
          academicYearId,
          academicUnitId,
          sectionId: sectionId || null,
          subjectId: subjectId || null,
          createdById: teacherId!,
          title,
          description,
          instructions,
          type,
          category,
          submissionMode,
          maxMarks: maxMarks ? parseInt(maxMarks) : null,
          dueDate: new Date(dueDate),
          dueTime: dueTime || null,
          status,
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          allowLateSubmission,
          allowResubmission,
          resubmissionDeadline: resubmissionDeadline ? new Date(resubmissionDeadline) : null,
        },
        include: {
          academicYear: true,
          academicUnit: true,
          section: true,
          subject: true,
          createdBy: true,
        },
      })

      // Create attachments if provided
      if (attachments && attachments.length > 0) {
        await tx.assignmentAttachment.createMany({
          data: attachments.map((attachment: any, index: number) => ({
            assignmentId: newAssignment.id,
            type: attachment.type || 'FILE',
            url: attachment.url,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
            displayOrder: index,
          })),
        })
      }

      // If published, create pending submissions for all students in the class/section
      if (status === 'PUBLISHED') {
        const targetUnitId = sectionId || academicUnitId
        
        // Find students in target unit OR children units (if target is a class)
        const students = await tx.student.findMany({
          where: {
            OR: [
              { academicUnitId: targetUnitId },
              { academicUnit: { parentId: targetUnitId } }
            ],
            status: 'ACTIVE',
          },
          select: { id: true },
        })

        if (students.length > 0) {
          // Create submissions (skip if already exists)
          // Since createMany doesn't support skipDuplicates in all DBs/Prisma versions consistently or might fail on unique constraints differently,
          // and we don't have a unique constraint on assignmentId+studentId for submissions (we might, let's check),
          // actually we do NOT have a unique constraint on assignmentId+studentId in the schema snippet I saw earlier.
          // I should verify if I can just create them. 
          // The schema has `id` as PK. No unique constraint shown on `assignmentId, studentId`.
          // But logically there should be one active submission per student?
          // The schema has `version` in my mind but let's check.
          
          // Let's safe-guard by checking existing submissions if needed, but for bulk creation usually we assume new assignment = no submissions yet.
          await tx.assignmentSubmission.createMany({
            data: students.map((student) => ({
              assignmentId: newAssignment.id,
              studentId: student.id,
              status: 'PENDING',
            })),
          })
        }
      }

      return newAssignment
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
