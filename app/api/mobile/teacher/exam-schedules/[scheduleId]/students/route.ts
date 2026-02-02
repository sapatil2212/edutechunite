import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    const schoolId = req.headers.get('x-user-schoolId');
    const role = req.headers.get('x-user-role');

    if (!userId || role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { scheduleId } = params;

    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      select: {
        academicUnitId: true,
        maxMarks: true,
        passingMarks: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: "Schedule not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const students = await prisma.student.findMany({
      where: {
        academicUnitId: schedule.academicUnitId,
        schoolId: schoolId!,
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        rollNumber: true,
        profilePhoto: true,
      },
      orderBy: {
        rollNumber: "asc",
      },
    });

    const results = await prisma.examResult.findMany({
      where: {
        examScheduleId: scheduleId,
        studentId: {
          in: students.map((s) => s.id),
        },
      },
      select: {
        id: true,
        studentId: true,
        marksObtained: true,
        isAbsent: true,
        isDraft: true,
        percentage: true,
        grade: true,
        isPassed: true,
      },
    });

    const studentsWithResults = students.map((student) => {
      const result = results.find((r) => r.studentId === student.id);
      return {
        ...student,
        result: result || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          students: studentsWithResults,
          scheduleInfo: {
            maxMarks: schedule.maxMarks,
            passingMarks: schedule.passingMarks,
          },
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch students" },
      { status: 500, headers: corsHeaders }
    );
  }
}
