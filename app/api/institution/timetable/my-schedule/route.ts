import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DayOfWeek } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const isWeekly = searchParams.get('weekly') === 'true'
    
    const today = new Date()
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    const currentDay = days[today.getDay()] as DayOfWeek
    const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

    // Handle TEACHER role - show their teaching schedule across all classes
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
        select: { id: true, schoolId: true }
      })

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
      }

      // Check if teacher is a class teacher - if so, also get the class timetable
      const classTeacherAssignment = await prisma.classTeacher.findFirst({
        where: {
          teacherId: teacher.id,
          isActive: true,
          isPrimary: true
        },
        select: { academicUnitId: true }
      })

      // Get all published timetable slots where this teacher is assigned
      const teacherSlots = await prisma.timetableSlot.findMany({
        where: {
          OR: [
            // Slots where teacher is assigned to teach
            { teacherId: teacher.id },
            // Slots from the class where teacher is class teacher
            ...(classTeacherAssignment ? [{ academicUnitId: classTeacherAssignment.academicUnitId }] : [])
          ],
          isActive: true,
          timetable: {
            status: 'PUBLISHED',
            schoolId: teacher.schoolId
          }
        },
        include: {
          subject: {
            select: { name: true, code: true, color: true }
          },
          teacher: {
            select: { fullName: true }
          },
          academicUnit: {
            select: { 
              id: true, 
              name: true,
              parent: { select: { name: true } }
            }
          },
          timetable: {
            include: {
              template: {
                include: {
                  periodTimings: {
                    orderBy: { periodNumber: 'asc' }
                  }
                }
              }
            }
          }
        },
        orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
      })

      if (teacherSlots.length === 0) {
        return NextResponse.json({ 
          success: true,
          data: {
            schedule: {},
            periodTimings: {}
          }
        })
      }

      // Get period timings from the first timetable (assuming consistent template)
      const periodTimingsMap: Record<number, any> = {}
      teacherSlots.forEach(slot => {
        slot.timetable.template.periodTimings.forEach(timing => {
          if (!periodTimingsMap[timing.periodNumber]) {
            periodTimingsMap[timing.periodNumber] = {
              periodNumber: timing.periodNumber,
              name: timing.name,
              startTime: timing.startTime,
              endTime: timing.endTime,
              isBreak: timing.isBreak
            }
          }
        })
      })

      // Group slots by day for teacher
      const schedule: Record<string, any[]> = {}
      weekDays.forEach(day => {
        schedule[day] = teacherSlots
          .filter(s => s.dayOfWeek === day)
          .map(slot => ({
            periodNumber: slot.periodNumber,
            subject: slot.subject,
            teacher: slot.teacher,
            room: slot.room,
            slotType: slot.slotType,
            academicUnit: slot.academicUnit
          }))
      })

      return NextResponse.json({ 
        success: true,
        data: {
          schedule,
          periodTimings: periodTimingsMap
        }
      })
    }

    // Handle STUDENT and PARENT roles
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
      } else {
        // Get first linked student for parent
        const linkedStudent = await prisma.studentGuardian.findFirst({
          where: {
            guardian: { userId: session.user.id }
          },
          select: { studentId: true }
        })
        studentId = linkedStudent?.studentId || null
      }
    }

    if (!studentId) {
      return NextResponse.json({ 
        success: true,
        data: {
          schedule: {},
          periodTimings: [],
          message: 'No student profile linked'
        }
      })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { academicUnitId: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.academicUnitId) {
      return NextResponse.json({ 
        success: true,
        data: {
          schedule: {},
          periodTimings: [],
          message: 'Student not assigned to any class'
        }
      })
    }

    const timetable = await prisma.timetable.findFirst({
      where: {
        academicUnitId: student.academicUnitId,
        status: 'PUBLISHED'
      },
      include: {
        slots: {
          where: isWeekly ? { isActive: true } : { dayOfWeek: currentDay, isActive: true },
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
      return NextResponse.json({ 
        success: true,
        data: isWeekly 
          ? { schedule: {}, periodTimings: [], message: 'No published timetable for your class' } 
          : { todaySchedule: [], message: 'No published timetable for your class' }
      })
    }

    if (isWeekly) {
      // Group slots by day
      const schedule: Record<string, any[]> = {}
      
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

    return NextResponse.json({ 
      success: true,
      data: { todaySchedule }
    })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}
