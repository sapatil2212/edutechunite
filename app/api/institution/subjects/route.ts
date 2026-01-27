import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - List all subjects for the institution
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

    if (!user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const where: Record<string, unknown> = {
      schoolId: user.schoolId,
    }

    if (type) {
      where.type = type
    }

    if (activeOnly) {
      where.isActive = true
    }

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { timetableSlots: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: subjects,
    })
  } catch (error) {
    console.error('Get subjects error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subjects' },
      { status: 500 }
    )
  }
}

// POST - Create a new subject
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
      type = 'CORE',
      color,
      icon,
      displayOrder = 0,
      creditsPerWeek = 0,
      isActive = true,
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Subject name is required' },
        { status: 400 }
      )
    }

    if (!code?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Subject code is required' },
        { status: 400 }
      )
    }

    // Check for duplicate code
    const existing = await prisma.subject.findUnique({
      where: {
        schoolId_code: {
          schoolId: user.schoolId,
          code: code.trim().toUpperCase(),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A subject with this code already exists' },
        { status: 409 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId: user.schoolId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        type,
        color: color || null,
        icon: icon || null,
        displayOrder,
        creditsPerWeek,
        isActive,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    }, { status: 201 })
  } catch (error) {
    console.error('Create subject error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create subject' },
      { status: 500 }
    )
  }
}

