import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hashPassword, validatePassword } from '@/lib/utils/password'
import { sendEmail, getTeacherWelcomeEmailTemplate, getTeacherRegistrationNotificationTemplate } from '@/lib/email'

export const dynamic = 'force-dynamic'

// GET - List all teachers
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

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const subjectId = searchParams.get('subjectId')
    const schoolIdParam = searchParams.get('schoolId')

    // Determine which schoolId to use
    let targetSchoolId: string | null = null

    if (user?.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can access any school or all schools
      targetSchoolId = schoolIdParam || null
    } else if (user?.schoolId) {
      // Regular users can only access their own school
      targetSchoolId = user.schoolId
    } else {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    const where: any = {}
    
    // Only filter by schoolId if we have one (SUPER_ADMIN without schoolIdParam gets all)
    if (targetSchoolId) {
      where.schoolId = targetSchoolId
    }

    if (activeOnly) {
      where.isActive = true
    }

    if (subjectId) {
      where.subjectAssignments = {
        some: { subjectId }
      }
    }

    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { fullName: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, status: true }
        },
        subjectAssignments: {
          include: {
            subject: {
              select: { id: true, name: true, code: true, color: true }
            }
          }
        },
        _count: {
          select: { timetableSlots: true }
        }
      },
    })

    return NextResponse.json({
      success: true,
      data: teachers,
    })
  } catch (error) {
    console.error('Get teachers error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch teachers' },
      { status: 500 }
    )
  }
}

// POST - Create a new teacher
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
    const {
      employeeId,
      fullName,
      email,
      phone,
      qualification,
      specialization,
      maxPeriodsPerDay = 6,
      maxPeriodsPerWeek = 30,
      subjectIds = [],
      isActive = true,
      enableLogin = false,
      password,
    } = body

    // Validation
    if (!employeeId?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Employee ID is required' },
        { status: 400 }
      )
    }

    if (!fullName?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Full name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate employee ID
    const existing = await prisma.teacher.findUnique({
      where: {
        schoolId_employeeId: {
          schoolId: user.schoolId,
          employeeId: employeeId.trim(),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A teacher with this Employee ID already exists', field: 'employeeId' },
        { status: 409 }
      )
    }

    // Validate login requirements if enabled
    if (enableLogin) {
      if (!email?.trim()) {
        return NextResponse.json(
          { success: false, message: 'Email is required for login access', field: 'email' },
          { status: 400 }
        )
      }

      if (!password) {
        return NextResponse.json(
          { success: false, message: 'Password is required for login access', field: 'password' },
          { status: 400 }
        )
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { success: false, message: passwordValidation.message, field: 'password' },
          { status: 400 }
        )
      }

      // Check if email already exists for another user
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'A user with this email already exists', field: 'email' },
          { status: 409 }
        )
      }
    }

    // Create teacher with subject assignments
    const teacher = await prisma.$transaction(async (tx) => {
      let userId: string | null = null

      // Create user account if login is enabled
      if (enableLogin && email && password) {
        const hashedPassword = await hashPassword(password)
        const newUser = await tx.user.create({
          data: {
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            fullName: fullName.trim(),
            phone: phone?.trim() || '',
            role: 'TEACHER',
            status: 'ACTIVE',
            emailVerified: true, // Admin-created accounts are pre-verified
            emailVerifiedAt: new Date(),
            schoolId: user.schoolId!,
          },
        })
        userId = newUser.id
      }

      const newTeacher = await tx.teacher.create({
        data: {
          schoolId: user.schoolId!,
          employeeId: employeeId.trim(),
          fullName: fullName.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          qualification: qualification?.trim() || null,
          specialization: specialization?.trim() || null,
          maxPeriodsPerDay,
          maxPeriodsPerWeek,
          isActive,
          userId,
        },
      })

      // Create subject assignments
      if (subjectIds.length > 0) {
        for (const subjectId of subjectIds) {
          await tx.teacherSubject.create({
            data: {
              teacherId: newTeacher.id,
              subjectId,
            },
          })
        }
      }

      return newTeacher
    })

    // Fetch complete teacher with relations
    const completeTeacher = await prisma.teacher.findUnique({
      where: { id: teacher.id },
      include: {
        user: {
          select: { id: true, email: true, status: true }
        },
        subjectAssignments: {
          include: {
            subject: {
              select: { id: true, name: true, code: true, color: true }
            }
          }
        },
      },
    })

    // Get school info for email
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId! },
      select: { name: true, email: true },
    })

    // Send email notifications
    const loginUrl = `${process.env.NEXTAUTH_URL}/auth/login`
    const recipients: string[] = []

    // 1. Send welcome email to teacher if login is enabled
    if (enableLogin && email && password && school) {
      recipients.push(email.trim().toLowerCase())
      
      sendEmail({
        to: email.trim().toLowerCase(),
        subject: `Welcome to ${school.name} - Teacher Account Credentials`,
        html: getTeacherWelcomeEmailTemplate(
          fullName.trim(),
          email.trim().toLowerCase(),
          password,
          school.name,
          loginUrl
        ),
      }).catch(err => console.error('Failed to send teacher welcome email:', err))
    }

    // 2. Add school admins and super admins to notification list
    const adminRecipients: string[] = []
    
    // Fetch all active school admins
    const schoolAdmins = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId!,
        role: 'SCHOOL_ADMIN',
        status: 'ACTIVE'
      },
      select: { email: true }
    })
    schoolAdmins.forEach(admin => adminRecipients.push(admin.email))

    // Fetch all active super admins
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      },
      select: { email: true }
    })
    superAdmins.forEach(admin => adminRecipients.push(admin.email))

    // Send notifications to all admins
    const uniqueAdmins = Array.from(new Set(adminRecipients.filter(Boolean)))
    
    if (school) {
      uniqueAdmins.forEach(adminEmail => {
        sendEmail({
          to: adminEmail,
          subject: `New Teacher Registered at ${school.name}: ${fullName.trim()}`,
          html: getTeacherRegistrationNotificationTemplate(
            'Administrator',
            fullName.trim(),
            email?.trim() || 'Not provided',
            school.name,
            enableLogin
          ),
        }).catch(err => console.error(`Failed to send admin notification to ${adminEmail}:`, err))
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher created successfully',
      data: completeTeacher,
    }, { status: 201 })
  } catch (error) {
    console.error('Create teacher error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create teacher' },
      { status: 500 }
    )
  }
}

