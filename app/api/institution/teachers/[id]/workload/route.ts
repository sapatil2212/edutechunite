import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTeacherWorkloadSummary, findAvailableTeachers } from '@/lib/teacher-assignment/workload'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/institution/teachers/[id]/workload
 * Get comprehensive workload summary for a teacher
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId')

    if (!academicYearId) {
      return NextResponse.json(
        { success: false, message: 'Academic year ID is required' },
        { status: 400 }
      )
    }

    // Teachers can only view their own workload
    if (session.user.role === 'TEACHER' && session.user.teacherId !== id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const workload = await getTeacherWorkloadSummary(id, academicYearId)

    if (!workload) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: workload,
    })
  } catch (error) {
    console.error('Error fetching teacher workload:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch teacher workload' },
      { status: 500 }
    )
  }
}
