import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get a single subject
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

    const subject = await prisma.subject.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: { timetableSlots: true },
        },
      },
    })

    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: subject,
    })
  } catch (error) {
    console.error('Get subject error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subject' },
      { status: 500 }
    )
  }
}

// PATCH - Update a subject
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

    const existingSubject = await prisma.subject.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
    })

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { success: false, message: 'Subject name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.name = body.name.trim()
    }

    if (body.code !== undefined) {
      const newCode = body.code.trim().toUpperCase()
      // Check for duplicate code
      const duplicate = await prisma.subject.findFirst({
        where: {
          schoolId: user.schoolId,
          code: newCode,
          NOT: { id: params.id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: 'A subject with this code already exists' },
          { status: 409 }
        )
      }
      updateData.code = newCode
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }

    if (body.type !== undefined) {
      updateData.type = body.type
    }

    if (body.color !== undefined) {
      updateData.color = body.color || null
    }

    if (body.icon !== undefined) {
      updateData.icon = body.icon || null
    }

    if (body.displayOrder !== undefined) {
      updateData.displayOrder = body.displayOrder
    }

    if (body.creditsPerWeek !== undefined) {
      updateData.creditsPerWeek = body.creditsPerWeek
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive
    }

    const subject = await prisma.subject.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    })
  } catch (error) {
    console.error('Update subject error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update subject' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a subject
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

    const existingSubject = await prisma.subject.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: { timetableSlots: true },
        },
      },
    })

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      )
    }

    // Check if subject is used in timetable
    if (existingSubject._count.timetableSlots > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete subject that is used in timetable. Remove from timetable first.' },
        { status: 400 }
      )
    }

    await prisma.subject.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
    })
  } catch (error) {
    console.error('Delete subject error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete subject' },
      { status: 500 }
    )
  }
}

