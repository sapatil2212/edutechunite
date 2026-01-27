import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hashPassword, generateRandomPassword } from '@/lib/utils/password'
import { sendEmail, getStudentWelcomeEmailTemplate } from '@/lib/email'

// GET: List all students for the institution
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId')
    const academicUnitId = searchParams.get('academicUnitId')
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      schoolId: session.user.schoolId,
    }

    if (academicYearId) {
      where.academicYearId = academicYearId
    }

    if (academicUnitId) {
      where.academicUnitId = academicUnitId
    }

    if (courseId) {
      where.courseId = courseId || undefined
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { admissionNumber: { contains: search } },
        { email: { contains: search } },
      ]
    }

    // Get total count
    const total = await prisma.student.count({ where })

    // Get students with pagination
    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        admissionNumber: true,
        fullName: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        status: true,
        email: true,
        phone: true,
        profilePhoto: true,
        rollNumber: true,
        academicYear: {
          select: { id: true, name: true },
        },
        academicUnit: {
          select: { 
            id: true, 
            name: true, 
            type: true,
            parent: {
              select: { id: true, name: true },
            },
          },
        },
        course: {
          select: { id: true, name: true, type: true },
        },
        guardians: {
          where: { isPrimary: true },
          take: 1,
          select: {
            relationship: true,
            isPrimary: true,
            guardian: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                relationship: true,
              },
            },
          },
        },
      },
      orderBy: [
        { fullName: 'asc' },
      ],
      skip,
      take: limit,
    })

    return NextResponse.json({
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// POST: Create a new student
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SCHOOL_ADMIN and SUPER_ADMIN can create students
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      admissionNumber,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      nationality,
      email,
      phone,
      emergencyContact,
      address,
      city,
      state,
      pincode,
      profilePhoto,
      academicYearId,
      academicUnitId,
      courseId,
      stream,
      program,
      rollNumber,
      previousSchool,
      previousClass,
      guardians, // Array of guardian data
    } = body

    // Validate required fields
    if (!admissionNumber || !firstName || !lastName || !dateOfBirth || !gender || !academicYearId || !academicUnitId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if admission number already exists
    const existingStudent = await prisma.student.findUnique({
      where: {
        schoolId_admissionNumber: {
          schoolId: session.user.schoolId,
          admissionNumber,
        },
      },
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Admission number already exists' },
        { status: 400 }
      )
    }

    // Check if student is already enrolled in any active class for this academic year
    const existingEnrollment = await prisma.student.findFirst({
      where: {
        schoolId: session.user.schoolId,
        admissionNumber,
        academicYearId,
        status: 'ACTIVE',
      },
      include: {
        academicUnit: {
          select: {
            name: true,
            parent: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (existingEnrollment) {
      const className = existingEnrollment.academicUnit.parent
        ? `${existingEnrollment.academicUnit.parent.name} - ${existingEnrollment.academicUnit.name}`
        : existingEnrollment.academicUnit.name
      return NextResponse.json(
        { error: `Student with admission number ${admissionNumber} is already enrolled in ${className} for this academic year` },
        { status: 400 }
      )
    }

    // Check academic unit capacity
    const academicUnit = await prisma.academicUnit.findUnique({
      where: { id: academicUnitId },
    })

    if (!academicUnit) {
      return NextResponse.json(
        { error: 'Academic unit not found' },
        { status: 404 }
      )
    }

    if (academicUnit.currentStudents >= academicUnit.maxStudents) {
      return NextResponse.json(
        { error: 'Class capacity exceeded' },
        { status: 400 }
      )
    }

    // Build full name
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')

    // Check if student email is already taken if provided
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })
      if (existingUser) {
        return NextResponse.json(
          { error: `Email ${email} is already in use.` },
          { status: 400 }
        )
      }
    }

    // Generate random password for student
    const studentPassword = generateRandomPassword(10)
    const hashedStudentPassword = await hashPassword(studentPassword)

    // Create student with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account for student
      const user = await tx.user.create({
        data: {
          email: email || `${admissionNumber.toLowerCase()}@institution.com`,
          username: admissionNumber,
          password: hashedStudentPassword,
          fullName,
          phone: phone || '',
          role: 'STUDENT',
          status: 'ACTIVE',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          schoolId: session.user.schoolId!,
          mustChangePassword: true,
        } as any,
      })

      // Create the student
      const newStudent = await tx.student.create({
        data: {
          schoolId: session.user.schoolId!,
          admissionNumber,
          userId: user.id,
          firstName,
          middleName,
          lastName,
          fullName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          bloodGroup,
          nationality,
          email,
          phone,
          emergencyContact,
          address,
          city,
          state,
          pincode,
          profilePhoto,
          academicYearId,
          academicUnitId,
          courseId: courseId || undefined,
          stream,
          program,
          rollNumber,
          previousSchool,
          previousClass,
          status: 'ACTIVE',
        },
        include: {
          academicYear: true,
          academicUnit: {
            include: {
              parent: true
            }
          },
        },
      })

      // Create enrollment record
      await tx.studentEnrollment.create({
        data: {
          studentId: newStudent.id,
          academicYearId,
          academicUnitId,
          courseId: courseId || undefined,
          rollNumber,
          status: 'ACTIVE',
        },
      })

      // Update academic unit student count
      await tx.academicUnit.update({
        where: { id: academicUnitId },
        data: {
          currentStudents: { increment: 1 },
        },
      })

      // Create guardians if provided
      if (guardians && Array.isArray(guardians) && guardians.length > 0) {
        for (let i = 0; i < guardians.length; i++) {
          const guardianData = guardians[i]
          
          // Create or find guardian
          let guardian = await tx.guardian.findFirst({
            where: {
              schoolId: session.user.schoolId!,
              OR: [
                { phone: guardianData.phone },
                { email: guardianData.email || undefined },
              ].filter(cond => cond.phone || cond.email) as any,
            },
          })

          if (!guardian) {
            // Check if a user account already exists for this email
            let parentUserId: string | null = null
            
            if (guardianData.email) {
              const existingParentUser = await tx.user.findUnique({
                where: { email: guardianData.email.toLowerCase() }
              })
              if (existingParentUser) {
                parentUserId = existingParentUser.id
              }
            }

            // Create user account for primary parent if login is requested/optional and user doesn't exist
            if (!parentUserId && i === 0 && (guardianData.email || guardianData.phone)) {
              const parentPassword = generateRandomPassword(10)
              const hashedParentPassword = await hashPassword(parentPassword)
              const parentUsername = `P-${admissionNumber}`
              
              const parentUser = await tx.user.create({
                data: {
                  email: guardianData.email || `${parentUsername.toLowerCase()}@institution.com`,
                  username: parentUsername,
                  password: hashedParentPassword,
                  fullName: guardianData.fullName,
                  phone: guardianData.phone,
                  role: 'PARENT',
                  status: 'ACTIVE',
                  emailVerified: true,
                  emailVerifiedAt: new Date(),
                  schoolId: session.user.schoolId!,
                  mustChangePassword: true,
                },
              })
              parentUserId = parentUser.id
            }

            guardian = await tx.guardian.create({
              data: {
                schoolId: session.user.schoolId!,
                fullName: guardianData.fullName,
                relationship: guardianData.relationship || 'GUARDIAN',
                email: guardianData.email,
                phone: guardianData.phone,
                alternatePhone: guardianData.alternatePhone,
                occupation: guardianData.occupation,
                organization: guardianData.organization,
                address: guardianData.address,
                userId: parentUserId,
              },
            })
          }

          // Link guardian to student
          await tx.studentGuardian.create({
            data: {
              studentId: newStudent.id,
              guardianId: guardian.id,
              relationship: guardianData.relationship || 'GUARDIAN',
              isPrimary: i === 0, // First guardian is primary
              canPickup: guardianData.canPickup ?? true,
            },
          })
        }
      }

      return { student: newStudent, password: studentPassword }
    })

    // Get school details for email
    const school = await prisma.school.findUnique({
      where: { id: session.user.schoolId! },
      select: { name: true }
    })

    // Send welcome emails to student, admins and super admins
    if (school) {
      const loginUrl = `${process.env.NEXTAUTH_URL}/auth/login`
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/forgot-password`
      
      const academicInfo = {
        class: result.student.academicUnit.parent?.name || result.student.academicUnit.name,
        section: result.student.academicUnit.parentId ? result.student.academicUnit.name : 'N/A',
        year: result.student.academicYear.name
      }

      const welcomeHtml = getStudentWelcomeEmailTemplate(
        fullName,
        admissionNumber,
        result.password,
        school.name,
        loginUrl,
        resetUrl,
        academicInfo
      )

      // Collect all recipients
      const recipients: string[] = []
      
      // 1. Add student email if provided
      if (email) {
        recipients.push(email)
      }

      // 2. Add school admins
      const schoolAdmins = await prisma.user.findMany({
        where: {
          schoolId: session.user.schoolId!,
          role: 'SCHOOL_ADMIN',
          status: 'ACTIVE'
        },
        select: { email: true }
      })
      schoolAdmins.forEach(admin => recipients.push(admin.email))

      // 3. Add super admins
      const superAdmins = await prisma.user.findMany({
        where: {
          role: 'SUPER_ADMIN',
          status: 'ACTIVE'
        },
        select: { email: true }
      })
      superAdmins.forEach(admin => recipients.push(admin.email))

      // Remove duplicates and empty values
      const uniqueRecipients = Array.from(new Set(recipients.filter(Boolean)))

      console.log(`Sending student credentials to: ${uniqueRecipients.join(', ')}`)

      // Send emails
      await Promise.all(
        uniqueRecipients.map(recipientEmail => 
          sendEmail({
            to: recipientEmail,
            subject: `Student Registration Successful - ${fullName} (${admissionNumber})`,
            html: welcomeHtml
          }).then(success => {
            if (!success) {
              console.error(`Failed to send student credentials to ${recipientEmail}`)
            }
          })
        )
      )
    }

    return NextResponse.json({ student: result.student }, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
