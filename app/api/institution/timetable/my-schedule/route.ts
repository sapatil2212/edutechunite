import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DayOfWeek } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const isWeekly = searchParams.get('weekly') === 'true'
    
    let studentId = session.user.studentId
    
    if (session.user.role === 'PARENT') {
      const requestedStudentId = searchParams.get('studentId')
      
      if (requestedStudentId) {
        // Verify parent is linked to this student
        const isLinked = await prisma.studentGuardian.findFirst({
          where: {
            studentId: requestedStudentId,
            guardian: { userId: session.user.id }
          }
        })
        
        if (!isLinked) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        studentId = requestedStudentId
      }
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID not found' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { academicUnitId: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const today = new Date()
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    const currentDay = days[today.getDay()] as DayOfWeek

    const timetable = await prisma.timetable.findFirst({
      where: {
        academicUnitId: student.academicUnitId,
        status: 'PUBLISHED'
      },
      include: {
        slots: {
          where: isWeekly ? {} : { dayOfWeek: currentDay },
          include: {
            subject: {
              select: { name: true, code: true, color: true }
            },
            teacher: {
              select: { fullName: true }
            }
          },
          orderBy: { periodNumber: 'asc' }
        },
        template: {
          include: {
            periodTimings: {
              orderBy: { periodNumber: 'asc' }
            }
          }
        }
      }
    })

    if (!timetable) {
      return NextResponse.json(isWeekly ? { schedule: {}, periodTimings: [] } : { todaySchedule: [] })
    }

    if (isWeekly) {
      // Group slots by day
      const schedule: any = {}
      const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      
      weekDays.forEach(day => {
        schedule[day] = timetable.slots
          .filter(s => s.dayOfWeek === day)
          .map(slot => ({
            periodNumber: slot.periodNumber,
            subject: slot.subject,
            teacher: slot.teacher,
            room: slot.room,
            slotType: slot.slotType
          }))
      })

      return NextResponse.json({ 
        success: true,
        data: {
          schedule,
          periodTimings: timetable.template.periodTimings,
          academicUnit: timetable.academicUnitId
        }
      })
    }

    // Merge slots with timings for today view
    const todaySchedule = timetable.template.periodTimings.map(timing => {
      const slot = timetable.slots.find(s => s.periodNumber === timing.periodNumber)
      return {
        periodNumber: timing.periodNumber,
        startTime: timing.startTime,
        endTime: timing.endTime,
        isBreak: timing.isBreak,
        slotType: slot?.slotType || (timing.isBreak ? 'BREAK' : 'FREE'),
        subject: slot?.subject || null,
        teacher: slot?.teacher || null,
        room: slot?.room || null,
      }
    })

    return NextResponse.json({ todaySchedule })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}
