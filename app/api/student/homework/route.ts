import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get all homework assigned to the student's class
    const homework = await prisma.homework.findMany({
      where: {
        academicUnitId: student.academicUnitId,
        status: "PUBLISHED",
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
        submissions: {
          where: {
            studentId: student.id,
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            marksObtained: true,
            feedback: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Categorize homework
    const now = new Date();
    const pending = homework.filter(
      (hw) => hw.submissions.length === 0 && new Date(hw.dueDate) > now
    );
    const overdue = homework.filter(
      (hw) => hw.submissions.length === 0 && new Date(hw.dueDate) <= now
    );
    const submitted = homework.filter((hw) => hw.submissions.length > 0);

    return NextResponse.json({
      success: true,
      data: {
        all: homework,
        pending,
        overdue,
        submitted,
        stats: {
          total: homework.length,
          pending: pending.length,
          overdue: overdue.length,
          submitted: submitted.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework" },
      { status: 500 }
    );
  }
}
