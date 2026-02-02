import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getJWTUser } from '@/lib/jwt'
import prisma from '@/lib/prisma'

// GET - List all academic years for the institution
export async function GET(request: NextRequest) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(request)
    
    const user = session?.user || jwtUser

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Allow teachers and admins to access academic years (needed for assignment creation)
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const schoolIdParam = searchParams.get('schoolId')

    // Determine which schoolId to use
    let targetSchoolId: string | null = null

    if (user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can access any school or all schools
      targetSchoolId = schoolIdParam || null
    } else if (user.schoolId) {
      // Regular users can only access their own school
      targetSchoolId = user.schoolId
    } else {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
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

    const where: any = {}
    if (targetSchoolId) {
      where.schoolId = targetSchoolId
    }

    const academicYears = await prisma.academicYear.findMany({
      where,
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
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(request)
    
    const user = session?.user || jwtUser

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!user.schoolId) {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    // Only admins can create academic years
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
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
          schoolId: user.schoolId!,
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
        where: { schoolId: user.schoolId!, isCurrent: true },
        data: { isCurrent: false },
      })
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        schoolId: user.schoolId!,
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

