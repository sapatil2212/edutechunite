import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Add a section to an academic unit
export async function POST(
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

    // Get the parent unit
    const parentUnit = await prisma.academicUnit.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
        parentId: null, // Only top-level units can have sections
      },
      include: {
        children: true,
      },
    })

    if (!parentUnit) {
      return NextResponse.json(
        { success: false, message: 'Academic unit not found or is already a section' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, maxStudents = 40 } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Section name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate section name under this parent
    const duplicate = await prisma.academicUnit.findFirst({
      where: {
        schoolId: user.schoolId,
        academicYearId: parentUnit.academicYearId,
        parentId: parentUnit.id,
        name: name.trim(),
      },
    })

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: 'A section with this name already exists' },
        { status: 409 }
      )
    }

    // Get the next display order
    const maxOrder = parentUnit.children.reduce(
      (max, child) => Math.max(max, child.displayOrder),
      -1
    )

    const section = await prisma.academicUnit.create({
      data: {
        schoolId: user.schoolId,
        academicYearId: parentUnit.academicYearId,
        parentId: parentUnit.id,
        name: name.trim(),
        type: parentUnit.type,
        maxStudents,
        displayOrder: maxOrder + 1,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Section added successfully',
      data: section,
    }, { status: 201 })
  } catch (error) {
    console.error('Add section error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add section' },
      { status: 500 }
    )
  }
}

