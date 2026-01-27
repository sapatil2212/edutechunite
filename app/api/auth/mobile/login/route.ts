import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/utils/password'
import { SignJWT } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-fallback-secret'

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json()

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Please enter your credentials' },
        { status: 400 }
      )
    }

    const user: any = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
      include: { 
        school: true,
        studentProfile: true,
        guardianProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No account found with these credentials' },
        { status: 404 }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Please verify your email before logging in' },
        { status: 403 }
      )
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: `Your account is ${user.status.toLowerCase()}. Please contact support.` },
        { status: 403 }
      )
    }

    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      )
    }

    // Generate JWT for mobile
    const secret = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      studentId: user.studentProfile?.id,
      guardianId: user.guardianProfile?.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        schoolId: user.schoolId,
        studentId: user.studentProfile?.id,
        guardianId: user.guardianProfile?.id,
      }
    })

  } catch (error) {
    console.error('Mobile login error:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
