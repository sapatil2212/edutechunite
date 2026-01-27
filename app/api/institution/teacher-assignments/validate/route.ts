import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  validateClassTeacherAssignment, 
  validateSubjectTeacherAssignment,
  validateBulkAssignments,
} from '@/lib/teacher-assignment/validation'

/**
 * POST /api/institution/teacher-assignments/validate
 * Validate assignments before creating them
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { type, assignments } = body

    // Bulk validation
    if (type === 'bulk' && Array.isArray(assignments)) {
      const { academicYearId } = body
      
      if (!academicYearId) {
        return NextResponse.json(
          { success: false, message: 'Academic year ID is required for bulk validation' },
          { status: 400 }
        )
      }

      const result = await validateBulkAssignments(
        assignments,
        session.user.schoolId,
        academicYearId
      )

      return NextResponse.json({
        success: true,
        data: {
          totalCount: assignments.length,
          validCount: result.valid.length,
          invalidCount: result.invalid.length,
          valid: result.valid,
          invalid: result.invalid,
        },
      })
    }

    // Single class teacher validation
    if (type === 'class-teacher') {
      const {
        academicYearId,
        academicUnitId,
        teacherId,
        isPrimary,
        maxClassesAsClassTeacher,
        excludeId,
      } = body

      if (!academicYearId || !academicUnitId || !teacherId) {
        return NextResponse.json(
          { success: false, message: 'Academic year, class/section, and teacher are required' },
          { status: 400 }
        )
      }

      const result = await validateClassTeacherAssignment({
        schoolId: session.user.schoolId,
        academicYearId,
        academicUnitId,
        teacherId,
        isPrimary,
        excludeId,
        maxClassesAsClassTeacher,
      })

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    // Single subject teacher validation
    if (type === 'subject-teacher') {
      const {
        academicYearId,
        academicUnitId,
        subjectId,
        teacherId,
        periodsPerWeek,
        excludeId,
      } = body

      if (!academicYearId || !academicUnitId || !subjectId || !teacherId) {
        return NextResponse.json(
          { success: false, message: 'Academic year, class/section, subject, and teacher are required' },
          { status: 400 }
        )
      }

      const result = await validateSubjectTeacherAssignment({
        schoolId: session.user.schoolId,
        academicYearId,
        academicUnitId,
        subjectId,
        teacherId,
        periodsPerWeek,
        excludeId,
      })

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid validation type. Use "class-teacher", "subject-teacher", or "bulk"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error validating assignment:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to validate assignment' },
      { status: 500 }
    )
  }
}
