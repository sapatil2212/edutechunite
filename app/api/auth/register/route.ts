import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, validatePassword } from '@/lib/utils/password'
import { generateSchoolId, generateOTP } from '@/lib/utils/generate-id'
import { sendEmail, getOTPEmailTemplate } from '@/lib/email'
import { InstitutionType, SchoolType } from '@prisma/client'

interface RegisterRequestBody {
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
}

// Map frontend values to Prisma enums
const institutionTypeMap: Record<string, InstitutionType> = {
  school: 'SCHOOL',
  institute: 'INSTITUTE',
  college: 'COLLEGE',
  coaching: 'COACHING',
}

const schoolTypeMap: Record<string, SchoolType> = {
  preschool: 'PRESCHOOL',
  primary: 'PRIMARY',
  middle: 'MIDDLE',
  secondary: 'SECONDARY',
  senior_secondary: 'SENIOR_SECONDARY',
  integrated: 'INTEGRATED',
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequestBody = await request.json()
    
    // Validate required fields
    const requiredFields = ['institutionType', 'institutionName', 'address', 'city', 'state', 'fullName', 'email', 'phone', 'password']
    for (const field of requiredFields) {
      if (!body[field as keyof RegisterRequestBody]) {
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
        { success: false, message: 'Invalid phone number format' },
        { status: 400 }
      )
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(body.password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
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
    
    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
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
          status: 'PENDING',
          schoolId: school.id,
          verificationToken: otp,
          verificationExpiry: otpExpiry,
        },
      })
      
      return { school, user }
    })
    
    // Send OTP email asynchronously (non-blocking)
    const emailHtml = getOTPEmailTemplate(body.fullName, otp)
    
    sendEmail({
      to: body.email,
      subject: 'Verify Your Email - EduFlow ERP',
      html: emailHtml,
    }).catch(error => {
      console.error('Failed to send OTP email:', error)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email for the OTP.',
      data: {
        schoolId: result.school.schoolId,
        institutionName: result.school.name,
        email: result.user.email,
        userId: result.user.id,
      },
    }, { status: 201 })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    )
  }
}

