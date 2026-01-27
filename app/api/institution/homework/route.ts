import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getJWTUser } from '@/lib/jwt'
import prisma from '@/lib/prisma'

// GET: Get homework/assignments
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
    const academicUnitId = searchParams.get('academicUnitId')
    const subjectId = searchParams.get('subjectId')
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      schoolId: user.schoolId,
      status: 'PUBLISHED', // Only show published homework to students/parents
    }

    // For students and parents, filter by their class
    if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { academicUnitId: true, academicYearId: true },
      })
      if (!student) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }
      where.academicUnitId = student.academicUnitId
      where.academicYearId = student.academicYearId
    } else if (user.role === 'PARENT') {
      // Get linked students' classes
      const linkedStudents = await prisma.studentGuardian.findMany({
        where: {
          guardian: { userId: user.id },
        },
        include: {
          student: {
            select: { academicUnitId: true, academicYearId: true },
          },
        },
      })
      const unitIds = [...new Set(linkedStudents.map(s => s.student.academicUnitId))]
      where.academicUnitId = { in: unitIds }
    } else if (academicUnitId) {
      where.academicUnitId = academicUnitId
    }

    if (subjectId) {
      where.subjectId = subjectId
    }

    // For teachers, show all statuses
    if (['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) && status) {
      where.status = status
    }

    if (upcoming) {
      where.dueDate = { gte: new Date() }
    }

    const total = await prisma.homework.count({ where })

    const homeworks = await prisma.homework.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        academicUnit: {
          select: { id: true, name: true },
        },
        teacher: {
          select: { id: true, fullName: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    })

    // For students, include their submission status
    let homeworksWithSubmission = homeworks
    if (user.role === 'STUDENT' && user.studentId) {
      const submissions = await prisma.homeworkSubmission.findMany({
        where: {
          studentId: user.studentId,
          homeworkId: { in: homeworks.map(h => h.id) },
        },
      })
      const submissionMap = new Map(submissions.map(s => [s.homeworkId, s]))
      
      homeworksWithSubmission = homeworks.map(h => ({
        ...h,
        submission: submissionMap.get(h.id) || null,
      }))
    }

    return NextResponse.json({
      homeworks: homeworksWithSubmission,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching homework:', error)
    return NextResponse.json(
      { error: 'Failed to fetch homework' },
      { status: 500 }
    )
  }
}

// POST: Create homework (for teachers/admins)
export async function POST(req: NextRequest) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers and admins can create homework
    if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      description,
      instructions,
      academicYearId,
      academicUnitId,
      subjectId,
      teacherId,
      dueDate,
      attachments,
      maxMarks,
      allowLateSubmission,
      requiresSubmission,
      status,
    } = body

    if (!title || !academicYearId || !academicUnitId || !subjectId || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get teacher ID if not provided and user is a teacher
    let assignedTeacherId = teacherId
    if (!assignedTeacherId && user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: user.id },
      })
      assignedTeacherId = teacher?.id
    }

    const homework = await prisma.homework.create({
      data: {
        schoolId: user.schoolId,
        title,
        description,
        instructions,
        academicYearId,
        academicUnitId,
        subjectId,
        teacherId: assignedTeacherId,
        dueDate: new Date(dueDate),
        attachments,
        maxMarks,
        allowLateSubmission: allowLateSubmission ?? false,
        requiresSubmission: requiresSubmission ?? true,
        status: status || 'DRAFT',
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        subject: true,
        academicUnit: true,
        teacher: true,
      },
    })

    return NextResponse.json({ homework }, { status: 201 })
  } catch (error) {
    console.error('Error creating homework:', error)
    return NextResponse.json(
      { error: 'Failed to create homework' },
      { status: 500 }
    )
  }
}
