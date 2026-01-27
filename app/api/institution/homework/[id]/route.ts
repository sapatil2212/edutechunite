import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET: Get a single homework with submissions
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const homeworkId = params.id

    const homework = await prisma.homework.findFirst({
      where: {
        id: homeworkId,
        schoolId: session.user.schoolId,
      },
      include: {
        subject: true,
        academicUnit: {
          include: { parent: true },
        },
        teacher: true,
        submissions: session.user.role === 'STUDENT' ? {
          where: { studentId: session.user.studentId || undefined },
        } : session.user.role === 'PARENT' ? false : {
          include: {
            student: {
              select: { id: true, fullName: true, admissionNumber: true, rollNumber: true },
            },
          },
        },
      },
    })

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 })
    }

    // For students, check if they have access to this homework
    if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { academicUnitId: true },
      })
      if (student?.academicUnitId !== homework.academicUnitId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ homework })
  } catch (error) {
    console.error('Error fetching homework:', error)
    return NextResponse.json(
      { error: 'Failed to fetch homework' },
      { status: 500 }
    )
  }
}

// PUT: Update homework
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const homeworkId = params.id
    const body = await req.json()

    const homework = await prisma.homework.update({
      where: { id: homeworkId },
      data: {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        publishedAt: body.status === 'PUBLISHED' ? new Date() : undefined,
      },
      include: {
        subject: true,
        academicUnit: true,
        teacher: true,
      },
    })

    return NextResponse.json({ homework })
  } catch (error) {
    console.error('Error updating homework:', error)
    return NextResponse.json(
      { error: 'Failed to update homework' },
      { status: 500 }
    )
  }
}

// DELETE: Delete homework
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.homework.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Homework deleted successfully' })
  } catch (error) {
    console.error('Error deleting homework:', error)
    return NextResponse.json(
      { error: 'Failed to delete homework' },
      { status: 500 }
    )
  }
}
