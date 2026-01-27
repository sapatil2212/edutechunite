import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Default period timings
const defaultPeriodTimings = [
  { periodNumber: 1, name: 'Period 1', startTime: '09:00', endTime: '09:45', isBreak: false },
  { periodNumber: 2, name: 'Period 2', startTime: '09:45', endTime: '10:30', isBreak: false },
  { periodNumber: 3, name: 'Short Break', startTime: '10:30', endTime: '10:45', isBreak: true },
  { periodNumber: 4, name: 'Period 3', startTime: '10:45', endTime: '11:30', isBreak: false },
  { periodNumber: 5, name: 'Period 4', startTime: '11:30', endTime: '12:15', isBreak: false },
  { periodNumber: 6, name: 'Lunch Break', startTime: '12:15', endTime: '13:00', isBreak: true },
  { periodNumber: 7, name: 'Period 5', startTime: '13:00', endTime: '13:45', isBreak: false },
  { periodNumber: 8, name: 'Period 6', startTime: '13:45', endTime: '14:30', isBreak: false },
  { periodNumber: 9, name: 'Period 7', startTime: '14:30', endTime: '15:15', isBreak: false },
  { periodNumber: 10, name: 'Period 8', startTime: '15:15', endTime: '16:00', isBreak: false },
]

// GET - List all timetable templates
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

    const templates = await prisma.timetableTemplate.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { createdAt: 'desc' },
      include: {
        periodTimings: {
          orderBy: { periodNumber: 'asc' },
        },
        _count: {
          select: { timetableSlots: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST - Create a new timetable template
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
      description,
      periodsPerDay = 8,
      periodDuration = 45,
      workingDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      periodTimings,
      isDefault = false,
      isActive = true,
    } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Template name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.timetableTemplate.findUnique({
      where: {
        schoolId_name: {
          schoolId: user.schoolId,
          name: name.trim(),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A template with this name already exists' },
        { status: 409 }
      )
    }

    // If setting as default, unset existing default
    if (isDefault) {
      await prisma.timetableTemplate.updateMany({
        where: { schoolId: user.schoolId, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Create template with period timings
    const template = await prisma.$transaction(async (tx) => {
      const newTemplate = await tx.timetableTemplate.create({
        data: {
          schoolId: user.schoolId,
          name: name.trim(),
          description: description?.trim() || null,
          periodsPerDay,
          periodDuration,
          workingDays,
          isDefault,
          isActive,
        },
      })

      // Create period timings
      const timings = periodTimings || defaultPeriodTimings
      for (const timing of timings) {
        await tx.periodTiming.create({
          data: {
            templateId: newTemplate.id,
            periodNumber: timing.periodNumber,
            name: timing.name,
            startTime: timing.startTime,
            endTime: timing.endTime,
            isBreak: timing.isBreak || false,
          },
        })
      }

      return newTemplate
    })

    // Fetch the complete template with timings
    const completeTemplate = await prisma.timetableTemplate.findUnique({
      where: { id: template.id },
      include: {
        periodTimings: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      data: completeTemplate,
    }, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create template' },
      { status: 500 }
    )
  }
}

