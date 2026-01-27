import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CourseType, CourseStatus } from '@prisma/client'

// GET - List all courses for the institution
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
      select: { schoolId: true },
    })

    if (!user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as CourseType | null
    const status = searchParams.get('status') as CourseStatus | null

    const where: any = {
      schoolId: user.schoolId,
    }

    if (type) where.type = type
    if (status) where.status = status

    const courses = await prisma.course.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            academicUnits: true,
            students: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: courses,
    })
  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST - Create a new course
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
      name,
      code,
      description,
      type = 'ACADEMIC',
      durationValue,
      durationUnit,
    } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Course name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name/code
    const existing = await prisma.course.findFirst({
      where: {
        schoolId: user.schoolId,
        OR: [
          { name: name.trim() },
          code ? { code: code.trim() } : { id: 'never-match' },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Course with this name or code already exists' },
        { status: 409 }
      )
    }

    const course = await prisma.course.create({
      data: {
        schoolId: user.schoolId,
        name: name.trim(),
        code: code?.trim(),
        description,
        type: type as CourseType,
        durationValue,
        durationUnit,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      data: course,
    }, { status: 201 })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create course' },
      { status: 500 }
    )
  }
}
