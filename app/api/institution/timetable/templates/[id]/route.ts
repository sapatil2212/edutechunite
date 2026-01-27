import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get a single template with period timings
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

    const template = await prisma.timetableTemplate.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        periodTimings: {
          orderBy: { periodNumber: 'asc' },
        },
        _count: {
          select: { timetableSlots: true, timetables: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template,
    })
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PATCH - Update template and period timings
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

    const existingTemplate = await prisma.timetableTemplate.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, periodsPerDay, periodDuration, workingDays, isDefault, isActive, periodTimings } = body

    // Update template in a transaction
    const template = await prisma.$transaction(async (tx) => {
      const updateData: any = {}

      if (name !== undefined) {
        // Check for duplicate name
        if (name.trim() !== existingTemplate.name) {
          const duplicate = await tx.timetableTemplate.findFirst({
            where: {
              schoolId: user.schoolId!,
              name: name.trim(),
              NOT: { id: params.id },
            },
          })
          if (duplicate) {
            throw new Error('A template with this name already exists')
          }
        }
        updateData.name = name.trim()
      }

      if (description !== undefined) updateData.description = description?.trim() || null
      if (periodsPerDay !== undefined) updateData.periodsPerDay = periodsPerDay
      if (periodDuration !== undefined) updateData.periodDuration = periodDuration
      if (workingDays !== undefined) updateData.workingDays = workingDays
      if (isActive !== undefined) updateData.isActive = isActive

      // Handle default flag
      if (isDefault !== undefined && isDefault) {
        await tx.timetableTemplate.updateMany({
          where: { schoolId: user.schoolId!, isDefault: true },
          data: { isDefault: false },
        })
        updateData.isDefault = true
      } else if (isDefault === false) {
        updateData.isDefault = false
      }

      // Update template
      const updatedTemplate = await tx.timetableTemplate.update({
        where: { id: params.id },
        data: updateData,
      })

      // Update period timings if provided
      if (periodTimings && Array.isArray(periodTimings)) {
        // Delete existing timings
        await tx.periodTiming.deleteMany({
          where: { templateId: params.id },
        })

        // Create new timings
        for (const timing of periodTimings) {
          await tx.periodTiming.create({
            data: {
              templateId: params.id,
              periodNumber: timing.periodNumber,
              name: timing.name,
              startTime: timing.startTime,
              endTime: timing.endTime,
              isBreak: timing.isBreak || false,
            },
          })
        }
      }

      return updatedTemplate
    })

    // Fetch complete template
    const completeTemplate = await prisma.timetableTemplate.findUnique({
      where: { id: template.id },
      include: {
        periodTimings: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      data: completeTemplate,
    })
  } catch (error: any) {
    console.error('Update template error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a template
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

    const existingTemplate = await prisma.timetableTemplate.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: { timetableSlots: true, timetables: true },
        },
      },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if template is in use
    if (existingTemplate._count.timetables > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete template that has timetables. Delete the timetables first.' },
        { status: 400 }
      )
    }

    await prisma.timetableTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

