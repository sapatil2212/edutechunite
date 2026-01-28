import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AcademicUnitType } from '@prisma/client'

// GET - List all academic units for the institution
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
    const academicYearId = searchParams.get('academicYearId')
    const parentId = searchParams.get('parentId')
    const courseId = searchParams.get('courseId')
    const type = searchParams.get('type') as AcademicUnitType | null
    const includeChildren = searchParams.get('includeChildren') === 'true'

    // Build where clause
    const where: Record<string, unknown> = {
      schoolId: user.schoolId,
    }

    if (academicYearId) {
      where.academicYearId = academicYearId
    }

    if (courseId) {
      where.courseId = courseId || undefined
    }

    if (parentId === 'null' || parentId === '') {
      where.parentId = null // Get only top-level units
    } else if (parentId) {
      where.parentId = parentId
    }

    if (type) {
      where.type = type
    }

    const academicUnits = await prisma.academicUnit.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
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
        course: {
          select: {
            id: true,
            name: true,
            type: true,
          },
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
        ...(includeChildren && {
          children: {
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            select: {
              id: true,
              name: true,
              maxStudents: true,
              currentStudents: true,
              isActive: true,
            },
          },
        }),
        _count: {
          select: { children: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: academicUnits,
    })
  } catch (error) {
    console.error('Get academic units error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch academic units' },
      { status: 500 }
    )
  }
}

// POST - Create a new academic unit (class/batch) with optional sections
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
      name,
      academicYearId,
      courseId,
      type = 'CLASS',
      maxStudents = 40,
      displayOrder = 0,
      isActive = true,
      hasSections = false,
      sections = [],
      subjectIds = [], // Array of subject IDs to allocate to this class
      metadata,
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      )
    }

    if (!academicYearId) {
      return NextResponse.json(
        { success: false, message: 'Academic year is required' },
        { status: 400 }
      )
    }

    // Verify academic year belongs to this school
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        id: academicYearId,
        schoolId: user.schoolId,
      },
    })

    if (!academicYear) {
      return NextResponse.json(
        { success: false, message: 'Academic year not found' },
        { status: 404 }
      )
    }

    // Check for duplicate name in same academic year (for top-level units)
    const existing = await prisma.academicUnit.findFirst({
      where: {
        schoolId: user.schoolId,
        academicYearId,
        parentId: null,
        name: name.trim(),
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A class/batch with this name already exists in this academic year' },
        { status: 409 }
      )
    }

    // Create unit with optional sections in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the main academic unit
      const unit = await tx.academicUnit.create({
        data: {
          schoolId: user.schoolId!,
          academicYearId,
          courseId: courseId || undefined,
          name: name.trim(),
          type: type as AcademicUnitType,
          maxStudents: hasSections ? 0 : maxStudents, // If has sections, capacity is in sections
          displayOrder,
          isActive,
          metadata,
        },
      })

      // Allocate subjects to this class
      if (subjectIds && subjectIds.length > 0) {
        for (let i = 0; i < subjectIds.length; i++) {
          await tx.academicUnitSubject.create({
            data: {
              academicUnitId: unit.id,
              subjectId: subjectIds[i],
              displayOrder: i,
            },
          })
        }
      }

      // Create sections if specified
      const createdSections = []
      if (hasSections && sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i]
          const sectionUnit = await tx.academicUnit.create({
            data: {
              schoolId: user.schoolId!,
              academicYearId,
              courseId: courseId || undefined,
              parentId: unit.id,
              name: section.name?.trim() || `Section ${String.fromCharCode(65 + i)}`,
              type: type as AcademicUnitType,
              maxStudents: section.maxStudents || 40,
              displayOrder: i,
              isActive: true,
            },
          })

          // Allocate subjects to sections as well
          if (subjectIds && subjectIds.length > 0) {
            for (let j = 0; j < subjectIds.length; j++) {
              await tx.academicUnitSubject.create({
                data: {
                  academicUnitId: sectionUnit.id,
                  subjectId: subjectIds[j],
                  displayOrder: j,
                },
              })
            }
          }

          createdSections.push(sectionUnit)
        }
      }

      return { unit, sections: createdSections }
    })

    return NextResponse.json({
      success: true,
      message: 'Academic unit created successfully',
      data: result,
    }, { status: 201 })
  } catch (error) {
    console.error('Create academic unit error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create academic unit' },
      { status: 500 }
    )
  }
}

