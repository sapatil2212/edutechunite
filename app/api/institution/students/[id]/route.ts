import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET: Get a single student by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = params.id

    // Check access permissions
    // Students can only view their own profile
    // Parents can only view their linked children
    if (session.user.role === 'STUDENT') {
      if (session.user.studentId !== studentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (session.user.role === 'PARENT') {
      const isLinked = await prisma.studentGuardian.findFirst({
        where: {
          studentId,
          guardian: {
            userId: session.user.id,
          },
        },
      })
      if (!isLinked) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: session.user.schoolId,
      },
      include: {
        academicYear: true,
        academicUnit: {
          include: {
            parent: true,
          },
        },
        guardians: {
          include: {
            guardian: true,
          },
        },
        documents: true,
        enrollmentHistory: {
          include: {
            academicYear: true,
            academicUnit: true,
          },
          orderBy: {
            academicYear: {
              startDate: 'desc',
            },
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    )
  }
}

// PUT: Update a student
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update students
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const studentId = params.id
    const body = await req.json()

    // Check if student exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: session.user.schoolId,
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const {
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
      stream,
      program,
      rollNumber,
      status,
    } = body

    // Build full name if name parts changed
    let fullName = existingStudent.fullName
    if (firstName || middleName !== undefined || lastName) {
      fullName = [
        firstName || existingStudent.firstName,
        middleName !== undefined ? middleName : existingStudent.middleName,
        lastName || existingStudent.lastName,
      ].filter(Boolean).join(' ')
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        firstName: firstName || undefined,
        middleName: middleName !== undefined ? middleName : undefined,
        lastName: lastName || undefined,
        fullName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender || undefined,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
        nationality: nationality !== undefined ? nationality : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        emergencyContact: emergencyContact !== undefined ? emergencyContact : undefined,
        address: address !== undefined ? address : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        pincode: pincode !== undefined ? pincode : undefined,
        profilePhoto: profilePhoto !== undefined ? profilePhoto : undefined,
        stream: stream !== undefined ? stream : undefined,
        program: program !== undefined ? program : undefined,
        rollNumber: rollNumber !== undefined ? rollNumber : undefined,
        status: status || undefined,
      },
      include: {
        academicYear: true,
        academicUnit: true,
      },
    })

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

// DELETE: Deactivate/archive a student (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete students
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const studentId = params.id

    // Check if student exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: session.user.schoolId,
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Soft delete - change status to INACTIVE
    await prisma.$transaction(async (tx) => {
      // Update student status
      await tx.student.update({
        where: { id: studentId },
        data: { status: 'INACTIVE' },
      })

      // Update enrollment status
      await tx.studentEnrollment.updateMany({
        where: {
          studentId,
          status: 'ACTIVE',
        },
        data: {
          status: 'INACTIVE',
          exitDate: new Date(),
          exitReason: 'Student deactivated',
        },
      })

      // Decrement class student count
      await tx.academicUnit.update({
        where: { id: existingStudent.academicUnitId },
        data: {
          currentStudents: { decrement: 1 },
        },
      })
    })

    return NextResponse.json({ message: 'Student deactivated successfully' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
