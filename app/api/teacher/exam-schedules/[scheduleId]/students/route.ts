import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scheduleId } = params;

    // Get schedule details
    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      select: {
        academicUnitId: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Get all students in the academic unit
    const students = await prisma.student.findMany({
      where: {
        academicUnitId: schedule.academicUnitId,
        schoolId: session.user.schoolId!,
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        rollNumber: true,
      },
      orderBy: {
        rollNumber: "asc",
      },
    });

    // Get existing results for these students
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
      },
    });

    // Merge students with their results
    const studentsWithResults = students.map((student) => {
      const result = results.find((r) => r.studentId === student.id);
      return {
        ...student,
        result: result || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: studentsWithResults,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
