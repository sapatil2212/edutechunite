import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AcademicUnitType } from '@prisma/client'

// GET - Get a single academic unit with its sections
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

    const academicUnit = await prisma.academicUnit.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        },
        academicUnitSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
                color: true,
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { children: true },
        },
      },
    })

    if (!academicUnit) {
      return NextResponse.json(
        { success: false, message: 'Academic unit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: academicUnit,
    })
  } catch (error) {
    console.error('Get academic unit error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch academic unit' },
      { status: 500 }
    )
  }
}

// PATCH - Update an academic unit
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

    const existingUnit = await prisma.academicUnit.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
    })

    if (!existingUnit) {
      return NextResponse.json(
        { success: false, message: 'Academic unit not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, type, maxStudents, displayOrder, isActive, metadata, subjectIds } = body

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
      const duplicate = await prisma.academicUnit.findFirst({
        where: {
          schoolId: user.schoolId,
          academicYearId: existingUnit.academicYearId,
          parentId: existingUnit.parentId,
          name: name.trim(),
          NOT: { id: params.id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: 'A class/batch with this name already exists' },
          { status: 409 }
        )
      }

      updateData.name = name.trim()
    }

    if (type !== undefined) {
      updateData.type = type as AcademicUnitType
    }

    if (maxStudents !== undefined) {
      updateData.maxStudents = maxStudents
    }

    if (displayOrder !== undefined) {
      updateData.displayOrder = displayOrder
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata
    }

    // Handle subject allocation updates if provided
    if (subjectIds !== undefined) {
      // Update subjects in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete existing subject allocations
        await (tx as any).academicUnitSubject.deleteMany({
          where: { academicUnitId: params.id },
        })

        // Add new subject allocations
        if (Array.isArray(subjectIds) && subjectIds.length > 0) {
          for (let i = 0; i < subjectIds.length; i++) {
            await (tx as any).academicUnitSubject.create({
              data: {
                academicUnitId: params.id,
                subjectId: subjectIds[i],
                displayOrder: i,
              },
            })
          }
        }

        // Update the academic unit if there are other changes
        if (Object.keys(updateData).length > 0) {
          await tx.academicUnit.update({
            where: { id: params.id },
            data: updateData,
          })
        }
      })

      // Fetch updated unit with subjects
      const updatedUnit = await prisma.academicUnit.findUnique({
        where: { id: params.id },
        include: {
          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          },
          academicUnitSubjects: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  type: true,
                  color: true,
                },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Academic unit updated successfully',
        data: updatedUnit,
      })
    }

    const academicUnit = await prisma.academicUnit.update({
      where: { id: params.id },
      data: updateData,
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Academic unit updated successfully',
      data: academicUnit,
    })
  } catch (error) {
    console.error('Update academic unit error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update academic unit' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an academic unit (soft delete by setting isActive = false, or hard delete)
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

    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    const existingUnit = await prisma.academicUnit.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: { children: true },
        },
      },
    })

    if (!existingUnit) {
      return NextResponse.json(
        { success: false, message: 'Academic unit not found' },
        { status: 404 }
      )
    }

    // Check if there are students enrolled
    if (existingUnit.currentStudents > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete unit with enrolled students' },
        { status: 400 }
      )
    }

    if (hardDelete) {
      // Hard delete - will cascade to children due to Prisma relation
      await prisma.academicUnit.delete({
        where: { id: params.id },
      })

      return NextResponse.json({
        success: true,
        message: 'Academic unit deleted permanently',
      })
    } else {
      // Soft delete - set isActive to false for unit and all children
      await prisma.$transaction(async (tx) => {
        await tx.academicUnit.update({
          where: { id: params.id },
          data: { isActive: false },
        })

        // Also deactivate children
        await tx.academicUnit.updateMany({
          where: { parentId: params.id },
          data: { isActive: false },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Academic unit deactivated successfully',
      })
    }
  } catch (error) {
    console.error('Delete academic unit error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete academic unit' },
      { status: 500 }
    )
  }
}

