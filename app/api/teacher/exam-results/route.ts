import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get teacher's subject assignments
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: session.user.id,
        schoolId: session.user.schoolId,
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
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const subjectIds = teacher.subjectAssignments.map((a) => a.subjectId);

    // Get exam schedules for teacher's subjects
    const schedules = await prisma.examSchedule.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        marksEntryStatus: {
          in: ["COMPLETED", "LOCKED"],
        },
      },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        academicUnit: {
          select: {
            name: true,
          },
        },
        results: {
          select: {
            marksObtained: true,
            isAbsent: true,
            isPassed: true,
          },
        },
      },
    });

    // Calculate statistics for each schedule
    const resultsWithStats = schedules.map((schedule) => {
      const totalStudents = schedule.results.length;
      const appeared = schedule.results.filter((r) => !r.isAbsent).length;
      const absent = schedule.results.filter((r) => r.isAbsent).length;
      const passed = schedule.results.filter((r) => r.isPassed && !r.isAbsent).length;
      const failed = appeared - passed;

      const marksArray = schedule.results
        .filter((r) => !r.isAbsent)
        .map((r) => r.marksObtained);

      const averageMarks = marksArray.length > 0
        ? marksArray.reduce((a, b) => a + b, 0) / marksArray.length
        : 0;

      const highestMarks = marksArray.length > 0 ? Math.max(...marksArray) : 0;
      const lowestMarks = marksArray.length > 0 ? Math.min(...marksArray) : 0;
      const passPercentage = appeared > 0 ? (passed / appeared) * 100 : 0;

      return {
        id: schedule.id,
        exam: schedule.exam,
        subject: schedule.subject,
        academicUnit: schedule.academicUnit,
        stats: {
          totalStudents,
          appeared,
          passed,
          failed,
          absent,
          averageMarks,
          highestMarks,
          lowestMarks,
          passPercentage,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: resultsWithStats,
    });
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam results" },
      { status: 500 }
    );
  }
}
