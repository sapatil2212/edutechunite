import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hashPassword, validatePassword } from '@/lib/utils/password'

// GET - Get a single teacher
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      select: { schoolId: true },
    })

    if (!user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
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

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: teacher,
    })
  } catch (error) {
    console.error('Get teacher error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch teacher' },
      { status: 500 }
    )
  }
}

// PATCH - Update a teacher
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (user.role !== 'SCHOOL_ADMIN' && session.user.teacherId !== params.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
    })

    if (!existingTeacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updateData: any = {}

    if (body.employeeId !== undefined) {
      const newEmployeeId = body.employeeId.trim()
      // Check for duplicate
      const duplicate = await prisma.teacher.findFirst({
        where: {
          schoolId: user.schoolId,
          employeeId: newEmployeeId,
          NOT: { id: params.id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: 'A teacher with this Employee ID already exists', field: 'employeeId' },
          { status: 409 }
        )
      }
      updateData.employeeId = newEmployeeId
    }

    if (body.fullName !== undefined) updateData.fullName = body.fullName.trim()
    if (body.email !== undefined) updateData.email = body.email?.trim() || null
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null
    if (body.qualification !== undefined) updateData.qualification = body.qualification?.trim() || null
    if (body.specialization !== undefined) updateData.specialization = body.specialization?.trim() || null
    if (body.maxPeriodsPerDay !== undefined) updateData.maxPeriodsPerDay = body.maxPeriodsPerDay
    if (body.maxPeriodsPerWeek !== undefined) updateData.maxPeriodsPerWeek = body.maxPeriodsPerWeek
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    // Handle login credentials
    const { enableLogin, password, resetPassword } = body
    let newUserId: string | null | undefined = undefined

    // Validate login requirements if enabling login
    if (enableLogin && !existingTeacher.userId) {
      // Creating new login
      const email = body.email?.trim() || existingTeacher.email
      if (!email) {
        return NextResponse.json(
          { success: false, message: 'Email is required for login access', field: 'email' },
          { status: 400 }
        )
      }

      if (!password) {
        return NextResponse.json(
          { success: false, message: 'Password is required for new login access', field: 'password' },
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

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'A user with this email already exists', field: 'email' },
          { status: 409 }
        )
      }
    }

    // Validate password if resetting
    if (resetPassword && password && existingTeacher.userId) {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { success: false, message: passwordValidation.message, field: 'password' },
          { status: 400 }
        )
      }
    }

    // Update teacher and subject assignments
    await prisma.$transaction(async (tx) => {
      // Handle user account creation/update/deletion
      if (enableLogin && !existingTeacher.userId) {
        // Create new user account
        const email = body.email?.trim()?.toLowerCase() || existingTeacher.email?.toLowerCase()
        const hashedPassword = await hashPassword(password)
        const newUser = await tx.user.create({
          data: {
            email: email!,
            password: hashedPassword,
            fullName: body.fullName?.trim() || existingTeacher.fullName,
            phone: body.phone?.trim() || existingTeacher.phone || '',
            role: 'TEACHER',
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: new Date(),
            schoolId: user.schoolId!,
          },
        })
        newUserId = newUser.id
      } else if (!enableLogin && existingTeacher.userId) {
        // Remove login access - delete user account
        await tx.user.delete({
          where: { id: existingTeacher.userId },
        })
        newUserId = null
      } else if (resetPassword && password && existingTeacher.userId) {
        // Reset password for existing user
        const hashedPassword = await hashPassword(password)
        await tx.user.update({
          where: { id: existingTeacher.userId },
          data: { 
            password: hashedPassword,
            // Also update name/phone if changed
            fullName: body.fullName?.trim() || existingTeacher.fullName,
            phone: body.phone?.trim() || existingTeacher.phone || '',
          },
        })
      } else if (existingTeacher.userId) {
        // Just update user info if they have login
        await tx.user.update({
          where: { id: existingTeacher.userId },
          data: {
            fullName: body.fullName?.trim() || existingTeacher.fullName,
            phone: body.phone?.trim() || existingTeacher.phone || '',
            // Update email if changed (need to check uniqueness first)
            ...(body.email?.trim() && body.email.trim().toLowerCase() !== existingTeacher.email?.toLowerCase()
              ? { email: body.email.trim().toLowerCase() }
              : {}),
          },
        })
      }

      // Include userId update if changed
      if (newUserId !== undefined) {
        updateData.userId = newUserId
      }

      await tx.teacher.update({
        where: { id: params.id },
        data: updateData,
      })

      // Update subject assignments if provided
      if (body.subjectIds !== undefined) {
        // Remove existing assignments
        await tx.teacherSubject.deleteMany({
          where: { teacherId: params.id },
        })

        // Create new assignments
        for (const subjectId of body.subjectIds) {
          await tx.teacherSubject.create({
            data: {
              teacherId: params.id,
              subjectId,
            },
          })
        }
      }
    })

    // Fetch updated teacher
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully',
      data: teacher,
    })
  } catch (error) {
    console.error('Update teacher error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update teacher' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a teacher
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: { timetableSlots: true }
        }
      }
    })

    if (!existingTeacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      )
    }

    // Check if teacher is assigned to any slots
    if (existingTeacher._count.timetableSlots > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete teacher assigned to timetable slots. Remove assignments first.' },
        { status: 400 }
      )
    }

    await prisma.teacher.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    })
  } catch (error) {
    console.error('Delete teacher error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete teacher' },
      { status: 500 }
    )
  }
}

