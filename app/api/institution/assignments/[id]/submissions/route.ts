import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getJWTUser } from '@/lib/jwt'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only Teachers and Admins can view all submissions
    if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: assignmentId } = params

    // Fetch assignment to ensure it exists and belongs to the school
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
        schoolId: user.schoolId,
      },
      include: {
        academicUnit: true,
        section: true,
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // 1. Fetch all eligible students
    const studentWhere: any = {
      schoolId: user.schoolId,
      status: 'ACTIVE', // Only active students
    }

    if (assignment.sectionId) {
      // If assigned to a specific section
      studentWhere.academicUnitId = assignment.sectionId
    } else {
      // If assigned to the whole class, get students in the class OR in any section of the class
      studentWhere.OR = [
        { academicUnitId: assignment.academicUnitId },
        { academicUnit: { parentId: assignment.academicUnitId } }
      ]
    }

    const students = await prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        user: {
          select: {
            avatar: true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    // 2. Fetch existing submissions
    const existingSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId,
      },
      include: {
        attachments: true,
        evaluation: {
          include: {
            evaluatedBy: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // 3. Map submissions to students
    const submissionMap = new Map();
    // Use the latest version for each student
    existingSubmissions.forEach(sub => {
      if (sub.studentId) {
        if (!submissionMap.has(sub.studentId) || sub.version > submissionMap.get(sub.studentId).version) {
          submissionMap.set(sub.studentId, sub);
        }
      }
    });

    // 4. Combine into final list
    const submissions = students.map(student => {
      const submission = submissionMap.get(student.id);
      
      const enhancedStudent = {
        ...student,
        profilePhoto: student.user?.avatar || null
      }

      if (submission) {
        return {
          ...submission,
          student: enhancedStudent, // Attach student details with profilePhoto
          status: submission.status // Use existing status
        }
      } else {
        // Create a mock "PENDING" submission object for the UI
        return {
          id: `pending-${student.id}`, // Mock ID
          studentId: student.id,
          student: enhancedStudent,
          status: 'PENDING',
          submittedAt: null,
          isLate: false,
          attachments: [],
          evaluation: null
        }
      }
    })

    return NextResponse.json({ submissions })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assignmentId } = params
    const body = await req.json()
    const { remarks, attachments } = body

    // Verify student exists
    const student = await prisma.student.findFirst({
      where: { userId: user.id },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Verify assignment exists and is open for submission
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
        schoolId: user.schoolId,
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check deadlines
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    if (assignment.dueTime) {
      const [hours, minutes] = assignment.dueTime.split(':').map(Number)
      dueDate.setHours(hours, minutes, 0, 0)
    } else {
      dueDate.setHours(23, 59, 59, 999)
    }

    const isLate = now > dueDate

    if (isLate && !assignment.allowLateSubmission) {
      return NextResponse.json({ error: 'Late submissions are not allowed' }, { status: 400 })
    }

    // Check existing submission
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: student.id,
      },
      orderBy: { version: 'desc' },
    })

    if (existingSubmission && existingSubmission.status === 'EVALUATED') {
        // If evaluated, check if resubmission allowed
        if (!assignment.allowResubmission) {
             return NextResponse.json({ error: 'Resubmission not allowed after evaluation' }, { status: 400 })
        }
    }

    // Create new submission
    // If resubmitting, increment version
    const version = existingSubmission ? existingSubmission.version + 1 : 1

    // If there was a previous submission that was NOT evaluated (e.g. just PENDING or SUBMITTED), 
    // we might want to update it instead of creating new version?
    // But keeping history is good. However, if we spam versions for every save, it's bad.
    // The UI button says "Submit Assignment", implying a final action.
    
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: student.id,
        remarks,
        status: isLate ? 'LATE' : 'SUBMITTED',
        isLate,
        submittedAt: now,
        version,
        previousSubmissionId: existingSubmission?.id,
        attachments: {
          create: attachments?.map((file: any) => ({
            url: file.url,
            fileName: file.fileName,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
          })),
        },
      },
      include: {
        attachments: true,
      },
    })

    return NextResponse.json({ submission })

  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
