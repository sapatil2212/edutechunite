import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateSlotAssignment, getAvailableTeachers } from '@/lib/timetable/conflict-detection'

// GET - Get timetable slots for a timetable
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
      select: { schoolId: true },
    })

    if (!user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timetableId = searchParams.get('timetableId')
    const templateId = searchParams.get('templateId')
    const academicUnitId = searchParams.get('academicUnitId')

    // Get available teachers for a slot
    const getTeachers = searchParams.get('getAvailableTeachers')
    if (getTeachers === 'true') {
      const dayOfWeek = searchParams.get('dayOfWeek')
      const periodNumber = searchParams.get('periodNumber')
      const subjectId = searchParams.get('subjectId')

      if (!dayOfWeek || !periodNumber) {
        return NextResponse.json(
          { success: false, message: 'dayOfWeek and periodNumber required for available teachers' },
          { status: 400 }
        )
      }

      const teachers = await getAvailableTeachers(
        user.schoolId,
        dayOfWeek,
        parseInt(periodNumber),
        subjectId || undefined
      )

      return NextResponse.json({
        success: true,
        data: teachers,
      })
    }

    // Get slots for a specific timetable
    if (timetableId) {
      const timetable = await prisma.timetable.findFirst({
        where: {
          id: timetableId,
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
        data: {
          slots: timetable.slots,
          template: timetable.template,
        },
      })
    }

    // Legacy: Get slots by template and academic unit
    if (!templateId || !academicUnitId) {
      return NextResponse.json(
        { success: false, message: 'timetableId OR (templateId and academicUnitId) required' },
        { status: 400 }
      )
    }

    const slots = await prisma.timetableSlot.findMany({
      where: {
        schoolId: user.schoolId,
        templateId,
        academicUnitId,
        isActive: true,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        teacher: {
          select: { id: true, fullName: true, employeeId: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    })

    const template = await prisma.timetableTemplate.findUnique({
      where: { id: templateId },
      include: {
        periodTimings: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        slots,
        template,
      },
    })
  } catch (error) {
    console.error('Get slots error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch timetable slots' },
      { status: 500 }
    )
  }
}

// POST - Create or update a timetable slot with conflict detection
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
    const {
      timetableId,
      templateId,
      academicUnitId,
      subjectId,
      dayOfWeek,
      periodNumber,
      teacherId,
      room,
      slotType = 'REGULAR',
      notes,
      skipConflictCheck = false,
    } = body

    // Validation
    if (!timetableId) {
      return NextResponse.json(
        { success: false, message: 'Timetable ID is required' },
        { status: 400 }
      )
    }

    if (!dayOfWeek || periodNumber === undefined) {
      return NextResponse.json(
        { success: false, message: 'Day and period are required' },
        { status: 400 }
      )
    }

    // Get the timetable
    const timetable = await prisma.timetable.findFirst({
      where: {
        id: timetableId,
        schoolId: user.schoolId,
      },
    })

    if (!timetable) {
      return NextResponse.json(
        { success: false, message: 'Timetable not found' },
        { status: 404 }
      )
    }

    // Check if slot already exists
    const existingSlot = await prisma.timetableSlot.findUnique({
      where: {
        timetableId_dayOfWeek_periodNumber: {
          timetableId,
          dayOfWeek,
          periodNumber,
        },
      },
    })

    // Validate for conflicts (unless explicitly skipped)
    if (!skipConflictCheck && teacherId) {
      const conflicts = await validateSlotAssignment(user.schoolId, {
        timetableId,
        dayOfWeek,
        periodNumber,
        subjectId,
        teacherId,
        academicUnitId: timetable.academicUnitId,
        slotId: existingSlot?.id,
      })

      if (conflicts.length > 0) {
        return NextResponse.json({
          success: false,
          message: 'Conflicts detected',
          conflicts,
        }, { status: 409 })
      }
    }

    let slot
    if (existingSlot) {
      // Update existing slot
      slot = await prisma.timetableSlot.update({
        where: { id: existingSlot.id },
        data: {
          subjectId: subjectId || null,
          teacherId: teacherId || null,
          room: room || null,
          slotType,
          notes: notes || null,
          isActive: true,
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true, color: true },
          },
          teacher: {
            select: { id: true, fullName: true, employeeId: true },
          },
        },
      })
    } else {
      // Create new slot
      slot = await prisma.timetableSlot.create({
        data: {
          schoolId: user.schoolId,
          timetableId,
          templateId: timetable.templateId,
          academicUnitId: timetable.academicUnitId,
          subjectId: subjectId || null,
          teacherId: teacherId || null,
          dayOfWeek,
          periodNumber,
          room: room || null,
          slotType,
          notes: notes || null,
          isActive: true,
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true, color: true },
          },
          teacher: {
            select: { id: true, fullName: true, employeeId: true },
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Timetable slot saved successfully',
      data: slot,
    })
  } catch (error) {
    console.error('Save slot error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save timetable slot' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a timetable slot
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const slotId = searchParams.get('id')

    if (!slotId) {
      return NextResponse.json(
        { success: false, message: 'Slot ID is required' },
        { status: 400 }
      )
    }

    const existingSlot = await prisma.timetableSlot.findFirst({
      where: {
        id: slotId,
        schoolId: user.schoolId,
      },
    })

    if (!existingSlot) {
      return NextResponse.json(
        { success: false, message: 'Slot not found' },
        { status: 404 }
      )
    }

    await prisma.timetableSlot.delete({
      where: { id: slotId },
    })

    return NextResponse.json({
      success: true,
      message: 'Slot removed successfully',
    })
  } catch (error) {
    console.error('Delete slot error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete slot' },
      { status: 500 }
    )
  }
}

