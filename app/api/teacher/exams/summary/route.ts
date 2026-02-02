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
        exam: {
          schoolId: session.user.schoolId!,
        },
      },
      include: {
        exam: true,
      },
    });

    const now = new Date();
    
    // Calculate summary
    const totalExams = new Set(schedules.map((s) => s.examId)).size;
    const upcomingExams = schedules.filter(
      (s) => new Date(s.examDate) >= now && s.exam.status === "SCHEDULED"
    ).length;
    const completedExams = schedules.filter(
      (s) => s.exam.status === "COMPLETED" || s.exam.status === "RESULTS_PUBLISHED"
    ).length;
    const pendingMarksEntry = schedules.filter(
      (s) => s.marksEntryStatus === "NOT_STARTED" || s.marksEntryStatus === "IN_PROGRESS"
    ).length;

    // Get recent exams
    const recentExams = await prisma.exam.findMany({
      where: {
        schoolId: session.user.schoolId!,
        schedules: {
          some: {
            subjectId: {
              in: subjectIds,
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
      take: 5,
    });

    const formattedRecentExams = recentExams.map((exam) => ({
      id: exam.id,
      name: exam.name,
      code: exam.code,
      examType: exam.examType,
      startDate: exam.startDate,
      endDate: exam.endDate,
      status: exam.status,
      schedulesCount: exam._count.schedules,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalExams,
        upcomingExams,
        completedExams,
        pendingMarksEntry,
      },
      recentExams: formattedRecentExams,
    });
  } catch (error) {
    console.error("Error fetching exam summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam summary" },
      { status: 500 }
    );
  }
}
