import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get a single academic year
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
      select: { schoolId: true, role: true },
    })

    if (!user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: { academicUnits: true },
        },
      },
    })

    if (!academicYear) {
      return NextResponse.json(
        { success: false, message: 'Academic year not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: academicYear,
    })
  } catch (error) {
    console.error('Get academic year error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch academic year' },
      { status: 500 }
    )
  }
}

// PATCH - Update an academic year
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

    const existingYear = await prisma.academicYear.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
    })

    if (!existingYear) {
      return NextResponse.json(
        { success: false, message: 'Academic year not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, startDate, endDate, isActive, isCurrent } = body

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { success: false, message: 'Name cannot be empty' },
          { status: 400 }
        )
      }

      // Check for duplicate name (excluding current record)
      const duplicate = await prisma.academicYear.findFirst({
        where: {
          schoolId: user.schoolId,
          name: name.trim(),
          NOT: { id: params.id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: 'An academic year with this name already exists' },
          { status: 409 }
        )
      }

      updateData.name = name.trim()
    }

    if (startDate !== undefined) {
      updateData.startDate = new Date(startDate)
    }

    if (endDate !== undefined) {
      updateData.endDate = new Date(endDate)
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // If setting as current, unset any existing current year
    if (isCurrent === true) {
      await prisma.academicYear.updateMany({
        where: {
          schoolId: user.schoolId,
          isCurrent: true,
          NOT: { id: params.id },
        },
        data: { isCurrent: false },
      })
      updateData.isCurrent = true
    } else if (isCurrent === false) {
      updateData.isCurrent = false
    }

    const academicYear = await prisma.academicYear.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Academic year updated successfully',
      data: academicYear,
    })
  } catch (error) {
    console.error('Update academic year error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update academic year' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an academic year
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

    const existingYear = await prisma.academicYear.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: { academicUnits: true },
        },
      },
    })

    if (!existingYear) {
      return NextResponse.json(
        { success: false, message: 'Academic year not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if there are academic units
    if (existingYear._count.academicUnits > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete academic year with existing classes/batches. Please remove them first.' },
        { status: 400 }
      )
    }

    await prisma.academicYear.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Academic year deleted successfully',
    })
  } catch (error) {
    console.error('Delete academic year error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete academic year' },
      { status: 500 }
    )
  }
}

