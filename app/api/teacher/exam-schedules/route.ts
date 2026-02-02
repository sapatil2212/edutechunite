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

    // Get teacher record
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

    // Get subject IDs assigned to this teacher
    const subjectIds = teacher.subjectAssignments.map((assignment) => assignment.subjectId);

    // Get exam schedules for teacher's subjects
    const schedules = await prisma.examSchedule.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        exam: {
          schoolId: session.user.schoolId!,
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

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error("Error fetching teacher exam schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam schedules" },
      { status: 500 }
    );
  }
}
