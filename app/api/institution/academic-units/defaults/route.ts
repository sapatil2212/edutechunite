import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { InstitutionType, SchoolType } from '@prisma/client'

interface DefaultUnit {
  name: string
  displayOrder: number
  suggestedSections?: string[]
}

// Get smart defaults based on institution type
function getDefaultUnits(
  institutionType: InstitutionType,
  schoolType?: SchoolType | null
): { type: string; label: string; units: DefaultUnit[] } {
  switch (institutionType) {
    case 'SCHOOL':
      if (schoolType === 'PRESCHOOL') {
        return {
          type: 'CLASS',
          label: 'Classes',
          units: [
            { name: 'Playgroup', displayOrder: 0, suggestedSections: ['A', 'B'] },
            { name: 'Nursery', displayOrder: 1, suggestedSections: ['A', 'B'] },
            { name: 'Junior KG', displayOrder: 2, suggestedSections: ['A', 'B'] },
            { name: 'Senior KG', displayOrder: 3, suggestedSections: ['A', 'B'] },
          ],
        }
      } else if (schoolType === 'PRIMARY') {
        return {
          type: 'CLASS',
          label: 'Classes',
          units: [
            { name: 'Class 1', displayOrder: 0, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 2', displayOrder: 1, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 3', displayOrder: 2, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 4', displayOrder: 3, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 5', displayOrder: 4, suggestedSections: ['A', 'B', 'C'] },
          ],
        }
      } else if (schoolType === 'MIDDLE') {
        return {
          type: 'CLASS',
          label: 'Classes',
          units: [
            { name: 'Class 6', displayOrder: 0, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 7', displayOrder: 1, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 8', displayOrder: 2, suggestedSections: ['A', 'B', 'C'] },
          ],
        }
      } else if (schoolType === 'SECONDARY') {
        return {
          type: 'CLASS',
          label: 'Classes',
          units: [
            { name: 'Class 9', displayOrder: 0, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 10', displayOrder: 1, suggestedSections: ['A', 'B', 'C'] },
          ],
        }
      } else if (schoolType === 'SENIOR_SECONDARY') {
        return {
          type: 'CLASS',
          label: 'Classes',
          units: [
            { name: 'Class 11 - Science', displayOrder: 0, suggestedSections: ['A', 'B'] },
            { name: 'Class 11 - Commerce', displayOrder: 1, suggestedSections: ['A', 'B'] },
            { name: 'Class 11 - Arts', displayOrder: 2, suggestedSections: ['A'] },
            { name: 'Class 12 - Science', displayOrder: 3, suggestedSections: ['A', 'B'] },
            { name: 'Class 12 - Commerce', displayOrder: 4, suggestedSections: ['A', 'B'] },
            { name: 'Class 12 - Arts', displayOrder: 5, suggestedSections: ['A'] },
          ],
        }
      } else if (schoolType === 'INTEGRATED') {
        return {
          type: 'CLASS',
          label: 'Classes',
          units: [
            { name: 'Nursery', displayOrder: 0, suggestedSections: ['A', 'B'] },
            { name: 'Junior KG', displayOrder: 1, suggestedSections: ['A', 'B'] },
            { name: 'Senior KG', displayOrder: 2, suggestedSections: ['A', 'B'] },
            { name: 'Class 1', displayOrder: 3, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 2', displayOrder: 4, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 3', displayOrder: 5, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 4', displayOrder: 6, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 5', displayOrder: 7, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 6', displayOrder: 8, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 7', displayOrder: 9, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 8', displayOrder: 10, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 9', displayOrder: 11, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 10', displayOrder: 12, suggestedSections: ['A', 'B', 'C'] },
            { name: 'Class 11', displayOrder: 13, suggestedSections: ['A', 'B'] },
            { name: 'Class 12', displayOrder: 14, suggestedSections: ['A', 'B'] },
          ],
        }
      }
      // Default school
      return {
        type: 'CLASS',
        label: 'Classes',
        units: [
          { name: 'Class 1', displayOrder: 0, suggestedSections: ['A', 'B'] },
          { name: 'Class 2', displayOrder: 1, suggestedSections: ['A', 'B'] },
          { name: 'Class 3', displayOrder: 2, suggestedSections: ['A', 'B'] },
          { name: 'Class 4', displayOrder: 3, suggestedSections: ['A', 'B'] },
          { name: 'Class 5', displayOrder: 4, suggestedSections: ['A', 'B'] },
        ],
      }

    case 'COLLEGE':
      return {
        type: 'SEMESTER',
        label: 'Semesters',
        units: [
          { name: 'Semester 1', displayOrder: 0 },
          { name: 'Semester 2', displayOrder: 1 },
          { name: 'Semester 3', displayOrder: 2 },
          { name: 'Semester 4', displayOrder: 3 },
          { name: 'Semester 5', displayOrder: 4 },
          { name: 'Semester 6', displayOrder: 5 },
        ],
      }

    case 'COACHING':
      return {
        type: 'BATCH',
        label: 'Batches',
        units: [
          { name: 'Morning Batch', displayOrder: 0 },
          { name: 'Afternoon Batch', displayOrder: 1 },
          { name: 'Evening Batch', displayOrder: 2 },
          { name: 'Weekend Batch', displayOrder: 3 },
        ],
      }

    case 'INSTITUTE':
      return {
        type: 'BATCH',
        label: 'Batches',
        units: [
          { name: 'Batch A', displayOrder: 0 },
          { name: 'Batch B', displayOrder: 1 },
          { name: 'Batch C', displayOrder: 2 },
        ],
      }

    default:
      return {
        type: 'CLASS',
        label: 'Classes',
        units: [],
      }
  }
}

// GET - Get default academic units based on institution type
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

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: {
        institutionType: true,
        schoolType: true,
      },
    })

    if (!school) {
      return NextResponse.json(
        { success: false, message: 'Institution not found' },
        { status: 404 }
      )
    }

    const defaults = getDefaultUnits(school.institutionType, school.schoolType)

    return NextResponse.json({
      success: true,
      data: {
        institutionType: school.institutionType,
        schoolType: school.schoolType,
        ...defaults,
      },
    })
  } catch (error) {
    console.error('Get defaults error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch defaults' },
      { status: 500 }
    )
  }
}

// POST - Create multiple academic units from defaults
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
    const { academicYearId, units, includeSections = false } = body

    if (!academicYearId) {
      return NextResponse.json(
        { success: false, message: 'Academic year is required' },
        { status: 400 }
      )
    }

    if (!units || !Array.isArray(units) || units.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Units array is required' },
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

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { institutionType: true, schoolType: true },
    })

    const defaults = getDefaultUnits(school!.institutionType, school!.schoolType)

    // Create units in a transaction
    const createdUnits = await prisma.$transaction(async (tx) => {
      const results = []

      for (const unit of units) {
        // Check if already exists
        const existing = await tx.academicUnit.findFirst({
          where: {
            schoolId: user.schoolId,
            academicYearId,
            parentId: null,
            name: unit.name,
          },
        })

        if (existing) {
          continue // Skip if already exists
        }

        const createdUnit = await tx.academicUnit.create({
          data: {
            schoolId: user.schoolId,
            academicYearId,
            name: unit.name,
            type: defaults.type as 'CLASS' | 'SEMESTER' | 'BATCH' | 'YEAR' | 'TERM',
            displayOrder: unit.displayOrder || 0,
            maxStudents: includeSections ? 0 : 40,
            isActive: true,
          },
        })

        // Create sections if requested
        if (includeSections && unit.suggestedSections) {
          for (let i = 0; i < unit.suggestedSections.length; i++) {
            await tx.academicUnit.create({
              data: {
                schoolId: user.schoolId,
                academicYearId,
                parentId: createdUnit.id,
                name: `Section ${unit.suggestedSections[i]}`,
                type: defaults.type as 'CLASS' | 'SEMESTER' | 'BATCH' | 'YEAR' | 'TERM',
                displayOrder: i,
                maxStudents: 40,
                isActive: true,
              },
            })
          }
        }

        results.push(createdUnit)
      }

      return results
    })

    return NextResponse.json({
      success: true,
      message: `${createdUnits.length} academic units created successfully`,
      data: createdUnits,
    }, { status: 201 })
  } catch (error) {
    console.error('Create from defaults error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create academic units' },
      { status: 500 }
    )
  }
}

