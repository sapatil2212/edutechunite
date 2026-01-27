import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET: Get notices
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const noticeType = searchParams.get('noticeType')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      schoolId: session.user.schoolId,
      isPublished: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    }

    // Filter by target type based on user role
    if (session.user.role === 'STUDENT') {
      where.AND = [
        {
          OR: [
            { targetType: 'ALL' },
            { targetType: 'STUDENTS' },
            {
              targetType: 'CLASS',
              targetIds: {
                path: '$',
                array_contains: session.user.studentId,
              },
            },
          ],
        },
      ]
    } else if (session.user.role === 'PARENT') {
      where.AND = [
        {
          OR: [
            { targetType: 'ALL' },
            { targetType: 'PARENTS' },
          ],
        },
      ]
    }

    if (noticeType) {
      where.noticeType = noticeType
    }

    if (priority) {
      where.priority = priority
    }

    const total = await prisma.notice.count({ where })

    const notices = await prisma.notice.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' },
      ],
      skip,
      take: limit,
    })

    return NextResponse.json({
      notices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching notices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    )
  }
}

// POST: Create notice (for admins/teachers)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      content,
      noticeType,
      priority,
      targetType,
      targetIds,
      academicYearId,
      attachments,
      isPublished,
      scheduledFor,
      expiresAt,
    } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const notice = await prisma.notice.create({
      data: {
        schoolId: session.user.schoolId,
        title,
        content,
        noticeType: noticeType || 'GENERAL',
        priority: priority || 'MEDIUM',
        targetType: targetType || 'ALL',
        targetIds,
        academicYearId,
        attachments,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? new Date() : null,
        publishedBy: isPublished ? session.user.id : null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ notice }, { status: 201 })
  } catch (error) {
    console.error('Error creating notice:', error)
    return NextResponse.json(
      { error: 'Failed to create notice' },
      { status: 500 }
    )
  }
}
