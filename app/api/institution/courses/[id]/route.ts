import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CourseType, CourseStatus } from '@prisma/client'

// GET - Get course details
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

    const course = await prisma.course.findFirst({
      where: {
        id: params.id,
        schoolId: user?.schoolId!,
      },
      include: {
        academicUnits: {
          select: {
            id: true,
            name: true,
            type: true,
            currentStudents: true,
          }
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            students: true,
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: course,
    })
  } catch (error) {
    console.error('Get course error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PUT - Update course
export async function PUT(
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

    if (user?.role !== 'SCHOOL_ADMIN') {
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
      type,
      durationValue,
      durationUnit,
      status,
    } = body

    const existing = await prisma.course.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId!,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    // Business Rule: Immutability of certain fields if students enrolled?
    // For now, allow updates but we can add checks here later.

    const updated = await prisma.course.update({
      where: { id: params.id },
      data: {
        name: name?.trim(),
        code: code?.trim(),
        description,
        type: type as CourseType,
        durationValue,
        durationUnit,
        status: status as CourseStatus,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Update course error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update course' },
      { status: 500 }
    )
  }
}

// DELETE - Archive course (Soft delete/Status update)
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

    if (user?.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const course = await prisma.course.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId!,
      },
      include: {
        _count: {
          select: { students: true }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    // Business Rule: Courses cannot be deleted once students are enrolled
    if (course._count.students > 0) {
      // Switch to ARCHIVED instead of hard delete
      await prisma.course.update({
        where: { id: params.id },
        data: { status: 'ARCHIVED' },
      })

      return NextResponse.json({
        success: true,
        message: 'Course has enrolled students and was archived instead of deleted',
      })
    }

    await prisma.course.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    })
  } catch (error) {
    console.error('Delete course error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
