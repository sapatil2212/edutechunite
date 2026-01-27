import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - List all timetables or get a specific one
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true, role: true },
    })

    if (!user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const academicUnitId = searchParams.get('academicUnitId')
    const templateId = searchParams.get('templateId')
    const status = searchParams.get('status')
    const id = searchParams.get('id')

    // Get a specific timetable with all slots
    if (id) {
      const timetable = await prisma.timetable.findFirst({
        where: {
          id,
          schoolId: user.schoolId,
        },
        include: {
          template: {
            include: {
              periodTimings: {
                orderBy: { periodNumber: 'asc' },
              },
            },
          },
          academicUnit: {
            include: {
              parent: true,
            },
          },
          slots: {
            where: { isActive: true },
            include: {
              subject: {
                select: { id: true, name: true, code: true, color: true, type: true },
              },
              teacher: {
                select: { id: true, fullName: true, employeeId: true },
              },
            },
            orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
          },
        },
      })

      if (!timetable) {
        return NextResponse.json(
          { success: false, message: 'Timetable not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: timetable,
      })
    }

    // List timetables with filters
    const where: any = {
      schoolId: user.schoolId,
    }

    if (academicUnitId) where.academicUnitId = academicUnitId
    if (templateId) where.templateId = templateId
    if (status) where.status = status

    const timetables = await prisma.timetable.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        template: {
          select: { id: true, name: true },
        },
        academicUnit: {
          include: {
            parent: { select: { id: true, name: true } },
            academicYear: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { slots: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: timetables,
    })
  } catch (error) {
    console.error('Get timetables error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch timetables' },
      { status: 500 }
    )
  }
}

// POST - Create a new timetable
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true, role: true },
    })

    if (!user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    if (user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { templateId, academicUnitId, notes, effectiveFrom, effectiveTo } = body

    // Validation
    if (!templateId) {
      return NextResponse.json(
        { success: false, message: 'Template is required' },
        { status: 400 }
      )
    }

    if (!academicUnitId) {
      return NextResponse.json(
        { success: false, message: 'Class/Section is required' },
        { status: 400 }
      )
    }

    // Check if a draft timetable already exists for this class
    const existingDraft = await prisma.timetable.findFirst({
      where: {
        schoolId: user.schoolId,
        templateId,
        academicUnitId,
        status: 'DRAFT',
      },
    })

    if (existingDraft) {
      return NextResponse.json({
        success: true,
        message: 'Existing draft found',
        data: existingDraft,
        isExisting: true,
      })
    }

    // Get the latest version for this class
    const latestTimetable = await prisma.timetable.findFirst({
      where: {
        schoolId: user.schoolId,
        templateId,
        academicUnitId,
      },
      orderBy: { version: 'desc' },
    })

    const version = (latestTimetable?.version || 0) + 1

    // Create new timetable
    const timetable = await prisma.timetable.create({
      data: {
        schoolId: user.schoolId,
        templateId,
        academicUnitId,
        version,
        status: 'DRAFT',
        notes: notes || null,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      },
      include: {
        template: {
          include: {
            periodTimings: {
              orderBy: { periodNumber: 'asc' },
            },
          },
        },
        academicUnit: {
          include: {
            parent: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Timetable created successfully',
      data: timetable,
    }, { status: 201 })
  } catch (error) {
    console.error('Create timetable error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create timetable' },
      { status: 500 }
    )
  }
}

