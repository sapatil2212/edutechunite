import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/utils/password'
import { generateSchoolId, generateVerificationToken } from '@/lib/utils/generate-id'
import { sendEmail, getWelcomeEmailTemplate } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()

// Map frontend values to Prisma enums
const institutionTypeMap: Record<string, 'SCHOOL' | 'INSTITUTE' | 'COLLEGE' | 'COACHING'> = {
  school: 'SCHOOL',
  institute: 'INSTITUTE',
  college: 'COLLEGE',
  coaching: 'COACHING',
}

const schoolTypeMap: Record<string, 'PRESCHOOL' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY' | 'SENIOR_SECONDARY' | 'INTEGRATED'> = {
  preschool: 'PRESCHOOL',
  primary: 'PRIMARY',
  middle: 'MIDDLE',
  secondary: 'SECONDARY',
  senior_secondary: 'SENIOR_SECONDARY',
  integrated: 'INTEGRATED',
}

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

interface CreateInstitutionRequest {
  // Institution Type
  institutionType: 'school' | 'institute' | 'college' | 'coaching'
  schoolType?: string
  
  // Institution Details
  institutionName: string
  address: string
  city: string
  state: string
  district?: string
  pincode?: string
  website?: string
  
  // Admin Details
  fullName: string
  email: string
  phone: string
  password: string
  
  // Options
  sendWelcomeEmail?: boolean
  autoVerify?: boolean
}

export async function POST(request: NextRequest) {
  const auth = await verifySuperAdmin(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: 401 }
    )
  }

  try {
    const body: CreateInstitutionRequest = await request.json()

    // Validate required fields
    const requiredFields = ['institutionType', 'institutionName', 'address', 'city', 'state', 'fullName', 'email', 'phone', 'password']
    for (const field of requiredFields) {
      if (!body[field as keyof CreateInstitutionRequest]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate school type for schools
    if (body.institutionType === 'school' && !body.schoolType) {
      return NextResponse.json(
        { success: false, message: 'School type is required for schools' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone format (Indian)
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(body.phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format. Must be 10 digits starting with 6-9' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Check if school with same email exists
    const existingSchool = await prisma.school.findUnique({
      where: { email: body.email.toLowerCase() },
    })

    if (existingSchool) {
      return NextResponse.json(
        { success: false, message: 'An institution with this email already exists' },
        { status: 409 }
      )
    }

    // Generate unique school ID
    let schoolId = generateSchoolId()
    let idExists = await prisma.school.findUnique({ where: { schoolId } })
    while (idExists) {
      schoolId = generateSchoolId()
      idExists = await prisma.school.findUnique({ where: { schoolId } })
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password)

    // Determine if auto-verify (default true for super admin created institutions)
    const autoVerify = body.autoVerify !== false

    // Create school and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create school
      const school = await tx.school.create({
        data: {
          schoolId,
          institutionType: institutionTypeMap[body.institutionType],
          schoolType: body.schoolType ? schoolTypeMap[body.schoolType] : null,
          name: body.institutionName.trim(),
          address: body.address.trim(),
          city: body.city.trim(),
          state: body.state,
          district: body.district || null,
          pincode: body.pincode || null,
          website: body.website?.trim() || null,
          email: body.email.toLowerCase(),
          phone: `+91${body.phone}`,
          status: autoVerify ? 'ACTIVE' : 'PENDING_VERIFICATION',
          isVerified: autoVerify,
          verifiedAt: autoVerify ? new Date() : null,
        },
      })

      // Create admin user
      const user = await tx.user.create({
        data: {
          email: body.email.toLowerCase(),
          password: hashedPassword,
          fullName: body.fullName.trim(),
          phone: `+91${body.phone}`,
          role: 'SCHOOL_ADMIN',
          status: autoVerify ? 'ACTIVE' : 'PENDING',
          schoolId: school.id,
          emailVerified: autoVerify,
          emailVerifiedAt: autoVerify ? new Date() : null,
          verificationToken: autoVerify ? null : generateVerificationToken(),
          verificationExpiry: autoVerify ? null : new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      return { school, user }
    })

    // Send welcome email if requested
    if (body.sendWelcomeEmail !== false && autoVerify) {
      const emailHtml = getWelcomeEmailTemplate(
        body.fullName,
        body.institutionName,
        result.school.schoolId
      )

      await sendEmail({
        to: body.email,
        subject: `Welcome to EduFlow - ${body.institutionName}`,
        html: emailHtml,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Institution created successfully',
      data: {
        id: result.school.id,
        schoolId: result.school.schoolId,
        institutionName: result.school.name,
        email: result.user.email,
        status: result.school.status,
        adminId: result.user.id,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Create institution error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, message: `Failed to create institution: ${errorMessage}` },
      { status: 500 }
    )
  }
}

