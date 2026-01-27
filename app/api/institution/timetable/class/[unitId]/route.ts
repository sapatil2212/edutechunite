import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get published timetable for a class (read-only for students/parents)
export async function GET(
  request: NextRequest,
  { params }: { params: { unitId: string } }
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

    // Get the academic unit
    const academicUnit = await prisma.academicUnit.findFirst({
      where: {
        id: params.unitId,
        schoolId: user.schoolId,
      },
      include: {
        parent: true,
        academicYear: true,
      },
    })

    if (!academicUnit) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      )
    }

    // Get the published timetable for this class
    const timetable = await prisma.timetable.findFirst({
      where: {
        schoolId: user.schoolId,
        academicUnitId: params.unitId,
        status: 'PUBLISHED',
      },
      include: {
        template: {
          include: {
            periodTimings: {
              orderBy: { periodNumber: 'asc' },
            },
          },
        },
        slots: {
          where: { isActive: true },
          include: {
            subject: {
              select: { id: true, name: true, code: true, color: true },
            },
            teacher: {
              select: { id: true, fullName: true },
            },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
        },
      },
    })

    if (!timetable) {
      return NextResponse.json({
        success: true,
        data: {
          academicUnit: {
            id: academicUnit.id,
            name: academicUnit.name,
            parentName: academicUnit.parent?.name || null,
            academicYear: academicUnit.academicYear.name,
          },
          timetable: null,
          message: 'No published timetable available for this class',
        },
      })
    }

    // Format for read-only view
    const formattedSlots = timetable.slots.map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      slotType: slot.slotType,
      subject: slot.subject
        ? {
            name: slot.subject.name,
            code: slot.subject.code,
            color: slot.subject.color,
          }
        : null,
      teacher: slot.teacher
        ? {
            name: slot.teacher.fullName,
          }
        : null,
      room: slot.room,
    }))

    return NextResponse.json({
      success: true,
      data: {
        academicUnit: {
          id: academicUnit.id,
          name: academicUnit.name,
          parentName: academicUnit.parent?.name || null,
          academicYear: academicUnit.academicYear.name,
        },
        timetable: {
          id: timetable.id,
          version: timetable.version,
          publishedAt: timetable.publishedAt,
          workingDays: timetable.template.workingDays,
          periodTimings: timetable.template.periodTimings.map((p) => ({
            periodNumber: p.periodNumber,
            name: p.name,
            startTime: p.startTime,
            endTime: p.endTime,
            isBreak: p.isBreak,
          })),
          slots: formattedSlots,
        },
      },
    })
  } catch (error) {
    console.error('Get class timetable error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch timetable' },
      { status: 500 }
    )
  }
}

