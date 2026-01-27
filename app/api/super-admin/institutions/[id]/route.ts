import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()

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

// GET - Get single institution with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: 401 }
    )
  }

  try {
    const { id } = params

    const institution = await prisma.school.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            emailVerifiedAt: true,
            lastLoginAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!institution) {
      return NextResponse.json(
        { success: false, message: 'Institution not found' },
        { status: 404 }
      )
    }

    // Get user statistics
    const userStats = {
      total: institution.users.length,
      admins: institution.users.filter(u => u.role === 'SCHOOL_ADMIN').length,
      teachers: institution.users.filter(u => u.role === 'TEACHER').length,
      students: institution.users.filter(u => u.role === 'STUDENT').length,
      staff: institution.users.filter(u => u.role === 'STAFF').length,
      active: institution.users.filter(u => u.status === 'ACTIVE').length,
      pending: institution.users.filter(u => u.status === 'PENDING').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        institution: {
          id: institution.id,
          schoolId: institution.schoolId,
          institutionType: institution.institutionType,
          schoolType: institution.schoolType,
          name: institution.name,
          address: institution.address,
          city: institution.city,
          state: institution.state,
          district: institution.district,
          pincode: institution.pincode,
          email: institution.email,
          phone: institution.phone,
          website: institution.website,
          logo: institution.logo,
          status: institution.status,
          isVerified: institution.isVerified,
          verifiedAt: institution.verifiedAt,
          maxStudents: institution.maxStudents,
          maxTeachers: institution.maxTeachers,
          maxStaff: institution.maxStaff,
          createdAt: institution.createdAt,
          updatedAt: institution.updatedAt,
        },
        users: institution.users,
        userStats,
      },
    })

  } catch (error) {
    console.error('Fetch institution error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch institution details' },
      { status: 500 }
    )
  }
}

// PATCH - Update institution details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: 401 }
    )
  }

  try {
    const { id } = params
    const body = await request.json()

    // Check if institution exists
    const existingInstitution = await prisma.school.findUnique({
      where: { id },
    })

    if (!existingInstitution) {
      return NextResponse.json(
        { success: false, message: 'Institution not found' },
        { status: 404 }
      )
    }

    // Allowed fields to update
    const allowedFields = [
      'name',
      'address',
      'city',
      'state',
      'district',
      'pincode',
      'phone',
      'website',
      'maxStudents',
      'maxTeachers',
      'maxStaff',
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const updatedInstitution = await prisma.school.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Institution updated successfully',
      data: updatedInstitution,
    })

  } catch (error) {
    console.error('Update institution error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update institution' },
      { status: 500 }
    )
  }
}

// DELETE - Delete institution (soft delete by setting status to INACTIVE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: 401 }
    )
  }

  try {
    const { id } = params

    // Check if institution exists
    const existingInstitution = await prisma.school.findUnique({
      where: { id },
    })

    if (!existingInstitution) {
      return NextResponse.json(
        { success: false, message: 'Institution not found' },
        { status: 404 }
      )
    }

    // Soft delete - set status to INACTIVE and deactivate all users
    await prisma.$transaction([
      prisma.school.update({
        where: { id },
        data: { status: 'INACTIVE' },
      }),
      prisma.user.updateMany({
        where: { schoolId: id },
        data: { status: 'INACTIVE' },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Institution deactivated successfully',
    })

  } catch (error) {
    console.error('Delete institution error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete institution' },
      { status: 500 }
    )
  }
}

