import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get timetable with all slots
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const timetable = await prisma.timetable.findFirst({
      where: {
        id: params.id,
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
            academicYear: true,
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
  } catch (error) {
    console.error('Get timetable error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch timetable' },
      { status: 500 }
    )
  }
}

// PATCH - Update timetable (status, notes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      select: { schoolId: true, role: true, id: true },
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

    const existingTimetable = await prisma.timetable.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
    })

    if (!existingTimetable) {
      return NextResponse.json(
        { success: false, message: 'Timetable not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updateData: any = {}

    // Handle status change
    if (body.status !== undefined) {
      if (body.status === 'PUBLISHED') {
        updateData.status = 'PUBLISHED'
        updateData.publishedAt = new Date()
        updateData.publishedBy = user.id

        // Archive any other published timetable for this class
        await prisma.timetable.updateMany({
          where: {
            schoolId: user.schoolId,
            academicUnitId: existingTimetable.academicUnitId,
            templateId: existingTimetable.templateId,
            status: 'PUBLISHED',
            NOT: { id: params.id },
          },
          data: { status: 'ARCHIVED' },
        })
      } else {
        updateData.status = body.status
      }
    }

    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.effectiveFrom !== undefined) {
      updateData.effectiveFrom = body.effectiveFrom ? new Date(body.effectiveFrom) : null
    }
    if (body.effectiveTo !== undefined) {
      updateData.effectiveTo = body.effectiveTo ? new Date(body.effectiveTo) : null
    }

    const timetable = await prisma.timetable.update({
      where: { id: params.id },
      data: updateData,
      include: {
        template: {
          include: {
            periodTimings: {
              orderBy: { periodNumber: 'asc' },
            },
          },
        },
        academicUnit: {
          include: { parent: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: body.status === 'PUBLISHED' ? 'Timetable published successfully' : 'Timetable updated successfully',
      data: timetable,
    })
  } catch (error) {
    console.error('Update timetable error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update timetable' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a timetable
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingTimetable = await prisma.timetable.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
    })

    if (!existingTimetable) {
      return NextResponse.json(
        { success: false, message: 'Timetable not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting published timetables
    if (existingTimetable.status === 'PUBLISHED') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete a published timetable. Archive it instead.' },
        { status: 400 }
      )
    }

    await prisma.timetable.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Timetable deleted successfully',
    })
  } catch (error) {
    console.error('Delete timetable error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete timetable' },
      { status: 500 }
    )
  }
}

