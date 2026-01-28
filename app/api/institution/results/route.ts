import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Get student results
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const examId = searchParams.get('examId')
    const academicYearId = searchParams.get('academicYearId')

    // Build where clause
    const where: any = {}

    // Access control for students and parents
    if (session.user.role === 'STUDENT') {
      if (!session.user.studentId) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }
      where.studentId = session.user.studentId
    } else if (session.user.role === 'PARENT') {
      const linkedStudents = await prisma.studentGuardian.findMany({
        where: {
          guardian: { userId: session.user.id },
        },
        select: { studentId: true },
      })
      const studentIds = linkedStudents.map(s => s.studentId)
      
      if (studentId && studentIds.includes(studentId)) {
        where.studentId = studentId
      } else {
        where.studentId = { in: studentIds }
      }
    } else if (studentId) {
      where.studentId = studentId
    }

    if (examId) {
      where.examId = examId
      // Only show results if published
      where.exam = { status: 'RESULTS_PUBLISHED' }
    }

    // Only show published results to students/parents
    if (['STUDENT', 'PARENT'].includes(session.user.role)) {
      where.exam = { status: 'RESULTS_PUBLISHED' }
    }

    const results = await prisma.examResult.findMany({
      where,
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            examType: true,
            startDate: true,
            endDate: true,
            showRank: true,
            showPercentage: true,
            showGrade: true,
          },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
            academicUnit: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [
        { exam: { startDate: 'desc' } },
        { subject: { name: 'asc' } },
      ],
    })

    // Group results by exam for better organization
    const groupedResults = results.reduce((acc: any, result) => {
      const examId = result.examId
      if (!acc[examId]) {
        acc[examId] = {
          exam: result.exam,
          student: result.student,
          subjects: [],
          totalMarks: 0,
          totalMaxMarks: 0,
        }
      }
      acc[examId].subjects.push({
        subject: result.subject,
        maxMarks: result.maxMarks,
        marksObtained: result.marksObtained,
        percentage: result.percentage,
        grade: result.grade,
        classRank: result.classRank,
        isAbsent: result.isAbsent,
        remarks: result.remarks,
      })
      if (result.marksObtained !== null) {
        acc[examId].totalMarks += result.marksObtained
        acc[examId].totalMaxMarks += result.maxMarks
      }
      return acc
    }, {})

    // Calculate overall percentage and grade for each exam
    const examResults = Object.values(groupedResults).map((examResult: any) => ({
      ...examResult,
      overallPercentage: examResult.totalMaxMarks > 0 
        ? ((examResult.totalMarks / examResult.totalMaxMarks) * 100).toFixed(2)
        : null,
    }))

    return NextResponse.json({ results: examResults })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}

// POST: Enter results (for teachers/admins)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      examId,
      examScheduleId,
      subjectId,
      results, // Array of {studentId, marksObtained, isAbsent, remarks}
    } = body

    if (!examId || !subjectId || !results?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get exam schedule for max marks
    const schedule = examScheduleId 
      ? await prisma.examSchedule.findUnique({ where: { id: examScheduleId } })
      : await prisma.examSchedule.findFirst({ where: { examId, subjectId } })

    const maxMarks = schedule?.maxMarks || 100

    // Get exam grading system
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { gradingSystem: true },
    })

    // Calculate grade based on percentage
    const calculateGrade = (marks: number, maxMarks: number) => {
      const percentage = (marks / maxMarks) * 100
      const gradingSystem = exam?.gradingSystem as any
      
      if (gradingSystem) {
        for (const [grade, range] of Object.entries(gradingSystem)) {
          const r = range as { min: number; max: number }
          if (percentage >= r.min && percentage <= r.max) {
            return grade
          }
        }
      }
      
      // Default grading
      if (percentage >= 90) return 'A+'
      if (percentage >= 80) return 'A'
      if (percentage >= 70) return 'B+'
      if (percentage >= 60) return 'B'
      if (percentage >= 50) return 'C'
      if (percentage >= 33) return 'D'
      return 'F'
    }

    // Create results in transaction
    const createdResults = await prisma.$transaction(async (tx) => {
      const created = []

      for (const result of results) {
        const percentage = result.marksObtained !== null 
          ? (result.marksObtained / maxMarks) * 100 
          : null
        const grade = result.marksObtained !== null 
          ? calculateGrade(result.marksObtained, maxMarks)
          : null

        const examResult = await tx.examResult.upsert({
          where: {
            examId_studentId_subjectId: {
              examId,
              studentId: result.studentId,
              subjectId,
            },
          },
          create: {
            examId,
            examScheduleId,
            studentId: result.studentId,
            subjectId,
            maxMarks,
            marksObtained: result.marksObtained,
            percentage,
            grade,
            isAbsent: result.isAbsent || false,
            remarks: result.remarks,
            enteredBy: session.user.id,
          },
          update: {
            marksObtained: result.marksObtained,
            percentage,
            grade,
            isAbsent: result.isAbsent || false,
            remarks: result.remarks,
            enteredBy: session.user.id,
            enteredAt: new Date(),
          },
        })
        created.push(examResult)
      }

      return created
    })

    return NextResponse.json({
      message: 'Results saved successfully',
      count: createdResults.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Error saving results:', error)
    return NextResponse.json(
      { error: 'Failed to save results' },
      { status: 500 }
    )
  }
}
