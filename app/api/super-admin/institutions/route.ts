import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()

// Middleware to verify super admin
async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('super-admin-token')?.value

  if (!token) {
    return { authenticated: false, error: 'Not authenticated' }
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    if (payload.role !== 'SUPER_ADMIN') {
      return { authenticated: false, error: 'Access denied' }
    }

    return { authenticated: true, userId: payload.id as string }
  } catch {
    return { authenticated: false, error: 'Invalid token' }
  }
}

// GET - List all institutions with pagination, search, and filters
export async function GET(request: NextRequest) {
  const auth = await verifySuperAdmin(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Search
    const search = searchParams.get('search') || ''

    // Filters
    const status = searchParams.get('status') // PENDING_VERIFICATION, ACTIVE, SUSPENDED, INACTIVE
    const institutionType = searchParams.get('type') // SCHOOL, INSTITUTE, COLLEGE, COACHING
    const state = searchParams.get('state')

    // Sort
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { schoolId: { contains: search } },
        { city: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (institutionType) {
      where.institutionType = institutionType
    }

    if (state) {
      where.state = state
    }

    // Fetch institutions with admin user
    const [institutions, total] = await Promise.all([
      prisma.school.findMany({
        where,
        include: {
          users: {
            where: { role: 'SCHOOL_ADMIN' },
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              status: true,
              emailVerified: true,
              lastLoginAt: true,
            },
            take: 1,
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.school.count({ where }),
    ])

    // Transform data for response
    const data = institutions.map((institution) => ({
      id: institution.id,
      schoolId: institution.schoolId,
      name: institution.name,
      institutionType: institution.institutionType,
      schoolType: institution.schoolType,
      email: institution.email,
      phone: institution.phone,
      city: institution.city,
      state: institution.state,
      district: institution.district,
      status: institution.status,
      isVerified: institution.isVerified,
      verifiedAt: institution.verifiedAt,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt,
      admin: institution.users[0] || null,
      totalUsers: institution._count.users,
    }))

    return NextResponse.json({
      success: true,
      data: {
        institutions: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    })

  } catch (error) {
    console.error('Fetch institutions error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch institutions' },
      { status: 500 }
    )
  }
}

