import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - List all academic years for the institution
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

    // Only admins can access academic setup
    if (user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if academicYear model exists (handles case when Prisma client not regenerated)
    if (!prisma.academicYear) {
      console.error('Prisma client needs to be regenerated. Run: npx prisma generate')
      return NextResponse.json(
        { success: false, message: 'Database configuration error. Please contact administrator.' },
        { status: 500 }
      )
    }

    const academicYears = await prisma.academicYear.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { academicUnits: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: academicYears,
    })
  } catch (error) {
    console.error('Get academic years error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check for common Prisma regeneration issue
    if (errorMessage.includes('undefined') || errorMessage.includes('findMany')) {
      return NextResponse.json(
        { success: false, message: 'Database models not initialized. Server restart required.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch academic years' },
      { status: 500 }
    )
  }
}

// POST - Create a new academic year
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
    const { name, startDate, endDate, isActive, isCurrent } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Start and end dates are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.academicYear.findUnique({
      where: {
        schoolId_name: {
          schoolId: user.schoolId,
          name: name.trim(),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An academic year with this name already exists' },
        { status: 409 }
      )
    }

    // If setting as current, unset any existing current year
    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { schoolId: user.schoolId, isCurrent: true },
        data: { isCurrent: false },
      })
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        schoolId: user.schoolId,
        name: name.trim(),
        startDate: start,
        endDate: end,
        isActive: isActive ?? true,
        isCurrent: isCurrent ?? false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Academic year created successfully',
      data: academicYear,
    }, { status: 201 })
  } catch (error) {
    console.error('Create academic year error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create academic year' },
      { status: 500 }
    )
  }
}

