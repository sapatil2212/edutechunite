import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET

export async function GET(request: NextRequest) {
  try {
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
      
      // Verify user still exists and is super admin
      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
      })

      if (!user || user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, message: 'Invalid session' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
          },
        },
      })
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    )
  }
}

