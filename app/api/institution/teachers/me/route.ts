import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Helper to get session from cookie or Bearer token
 */
async function getSessionOrToken(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session) return session

  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)
    if (payload) {
      return {
        user: {
          id: payload.userId,
          email: payload.email,
          name: payload.fullName,
          role: payload.role,
          schoolId: payload.schoolId,
          teacherId: payload.teacherId,
          institutionId: payload.schoolId, // Assumption based on token structure
        }
      }
    }
  }
  return null
}

/**
 * GET /api/institution/teachers/me
 * Get current teacher's full profile
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrToken(req)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const teacherId = session.user.teacherId
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            email: true,
            avatar: true,
          }
        },
      }
    })

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: teacher
    })

  } catch (error) {
    console.error('Error fetching teacher profile:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/institution/teachers/me
 * Update current teacher's profile
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionOrToken(req)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const teacherId = session.user.teacherId
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { fullName, phone, address, qualification, specialization, experience } = body

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        fullName,
        phone,
        address,
        qualification,
        specialization,
        experience,
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedTeacher,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error updating teacher profile:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
