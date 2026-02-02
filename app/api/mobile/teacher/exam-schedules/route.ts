import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  try {
    // Get user info from headers (set by middleware)
    const userId = req.headers.get('x-user-id');
    const schoolId = req.headers.get('x-user-schoolId');
    const role = req.headers.get('x-user-role');

    if (!userId || role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: userId,
        schoolId: schoolId!,
      },
      include: {
        subjectAssignments: {
          select: {
            subjectId: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const subjectIds = teacher.subjectAssignments.map((a) => a.subjectId);

    // Get exam schedules
    const schedules = await prisma.examSchedule.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        exam: {
          schoolId: schoolId!,
          status: {
            in: ["SCHEDULED", "ONGOING", "COMPLETED", "MARKS_ENTRY_IN_PROGRESS", "MARKS_ENTRY_COMPLETED"],
          },
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicUnit: {
          select: {
            id: true,
            name: true,
          },
        },
        exam: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: {
        examDate: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: schedules,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching teacher exam schedules:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam schedules" },
      { status: 500, headers: corsHeaders }
    );
  }
}
