import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET

export async function GET(request: NextRequest) {
  try {
    // Verify super admin token
    const token = request.cookies.get('super-admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const secret = new TextEncoder().encode(JWT_SECRET)
    
    try {
      const { payload } = await jwtVerify(token, secret)
      
      if (payload.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Fetch stats
    const [totalSchools, totalUsers, activeSchools, pendingVerifications] = await Promise.all([
      prisma.school.count(),
      prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      prisma.school.count({ where: { status: 'ACTIVE' } }),
      prisma.school.count({ where: { status: 'PENDING_VERIFICATION' } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalSchools,
        totalUsers,
        activeSchools,
        pendingVerifications,
      },
    })

  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

