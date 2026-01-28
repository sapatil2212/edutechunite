import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/institution/teachers/courses
 * Get all courses associated with the current teacher through their subject assignments
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const teacherId = session.user.teacherId
    if (!teacherId && session.user.role === 'TEACHER') {
      return NextResponse.json(
        { success: false, message: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    // Find all courses where the teacher teaches at least one subject
    // or is assigned to a class that belongs to a course
    const courses = await prisma.course.findMany({
      where: {
        schoolId: session.user.schoolId,
        OR: [
          {
            subjects: {
              some: {
                teacherClassAssignments: {
                  some: {
                    teacherId: teacherId
                  }
                }
              }
            }
          },
          {
            academicUnits: {
              some: {
                teacherClassAssignments: {
                  some: {
                    teacherId: teacherId
                  }
                }
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            students: true,
            subjects: true,
            academicUnits: true
          }
        },
        subjects: {
          where: {
            teacherClassAssignments: {
              some: {
                teacherId: teacherId
              }
            }
          },
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: courses,
    })
  } catch (error) {
    console.error('Error fetching teacher courses:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
