import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get institution profile for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user with school details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        school: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.school) {
      return NextResponse.json(
        { success: false, message: 'No institution associated with this user' },
        { status: 404 }
      )
    }

    // Get user statistics for the institution
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      where: { schoolId: user.school.id },
      _count: { id: true },
    })

    const stats = {
      totalUsers: userStats.reduce((sum, stat) => sum + stat._count.id, 0),
      admins: userStats.find(s => s.role === 'SCHOOL_ADMIN')?._count.id || 0,
      teachers: userStats.find(s => s.role === 'TEACHER')?._count.id || 0,
      students: userStats.find(s => s.role === 'STUDENT')?._count.id || 0,
      staff: userStats.find(s => s.role === 'STAFF')?._count.id || 0,
    }

    // Get the admin user details
    const adminUser = await prisma.user.findFirst({
      where: {
        schoolId: user.school.id,
        role: 'SCHOOL_ADMIN',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        institution: {
          id: user.school.id,
          schoolId: user.school.schoolId,
          name: user.school.name,
          institutionType: user.school.institutionType,
          schoolType: user.school.schoolType,
          address: user.school.address,
          city: user.school.city,
          state: user.school.state,
          district: user.school.district,
          pincode: user.school.pincode,
          email: user.school.email,
          phone: user.school.phone,
          website: user.school.website,
          logo: user.school.logo,
          status: user.school.status,
          isVerified: user.school.isVerified,
          verifiedAt: user.school.verifiedAt,
          maxStudents: user.school.maxStudents,
          maxTeachers: user.school.maxTeachers,
          maxStaff: user.school.maxStaff,
          createdAt: user.school.createdAt,
          updatedAt: user.school.updatedAt,
        },
        admin: adminUser,
        stats,
        currentUser: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error('Get institution profile error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch institution profile' },
      { status: 500 }
    )
  }
}

// PATCH - Update institution profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user with school details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { school: true },
    })

    if (!user || !user.school) {
      return NextResponse.json(
        { success: false, message: 'Institution not found' },
        { status: 404 }
      )
    }

    // Only SCHOOL_ADMIN can update institution details
    if (user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only admins can update institution details' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Fields that can be updated for institution
    const allowedSchoolFields = ['name', 'email', 'address', 'city', 'state', 'district', 'pincode', 'website', 'logo', 'phone']
    const updateSchoolData: Record<string, string | null> = {}

    for (const field of allowedSchoolFields) {
      if (body[field] !== undefined) {
        updateSchoolData[field] = body[field]
      }
    }

    if (Object.keys(updateSchoolData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Check if email is being changed and if it's unique
    if (updateSchoolData.email && updateSchoolData.email !== user.school.email) {
      const existingSchool = await prisma.school.findUnique({
        where: { email: updateSchoolData.email },
      })
      if (existingSchool) {
        return NextResponse.json(
          { success: false, message: 'This email is already registered with another institution' },
          { status: 400 }
        )
      }
    }

    const updatedSchool = await prisma.school.update({
      where: { id: user.school.id },
      data: updateSchoolData,
    })

    return NextResponse.json({
      success: true,
      message: 'Institution profile updated successfully',
      data: updatedSchool,
    })
  } catch (error) {
    console.error('Update institution profile error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update institution profile' },
      { status: 500 }
    )
  }
}

