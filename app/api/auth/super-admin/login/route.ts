import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/utils/password'

// Trim environment variables to handle any whitespace issues
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.trim()
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD?.trim()
const SUPER_ADMIN_SECURITY_KEY = process.env.SUPER_ADMIN_SECURITY_KEY?.trim()
const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()

interface SuperAdminLoginRequest {
  email: string
  password: string
  securityKey: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SuperAdminLoginRequest = await request.json()
    const { email, password, securityKey } = body

    // Validate required fields
    if (!email || !password || !securityKey) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and security key are required' },
        { status: 400 }
      )
    }

    // Check if environment variables are configured
    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD || !SUPER_ADMIN_SECURITY_KEY) {
      console.error('Super admin environment variables not configured')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Validate against environment credentials (trim inputs for safety)
    const emailMatch = email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    const passwordMatch = password === SUPER_ADMIN_PASSWORD
    const keyMatch = securityKey.trim() === SUPER_ADMIN_SECURITY_KEY

    if (!emailMatch || !passwordMatch || !keyMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if super admin exists in database
    let superAdmin = await prisma.user.findFirst({
      where: {
        email: SUPER_ADMIN_EMAIL.toLowerCase(),
        role: 'SUPER_ADMIN',
      },
    })

    if (!superAdmin) {
      // Check if user exists with this email but different role
      const existingUser = await prisma.user.findUnique({
        where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
      })

      if (existingUser) {
        // Update existing user to super admin
        superAdmin = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        })
      } else {
        // Create new super admin user
        const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD!)
        superAdmin = await prisma.user.create({
          data: {
            email: SUPER_ADMIN_EMAIL.toLowerCase(),
            password: hashedPassword,
            fullName: 'Super Administrator',
            phone: '+910000000000',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        })
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { lastLoginAt: new Date() },
    })

    // Generate JWT token
    const secret = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({
      id: superAdmin.id,
      email: superAdmin.email,
      role: 'SUPER_ADMIN',
      name: superAdmin.fullName,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.fullName,
          role: 'SUPER_ADMIN',
        },
        token,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set('super-admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Super admin login error:', error)
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        message: process.env.NODE_ENV === 'development' 
          ? `Login error: ${errorMessage}` 
          : 'An error occurred during login'
      },
      { status: 500 }
    )
  }
}

