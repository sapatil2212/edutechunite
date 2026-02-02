import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    if (!["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only admins can publish exams" },
        { status: 403 }
      );
    }

    const { examId } = params;

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: user.schoolId,
      },
      include: {
        schedules: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft exams can be published" },
        { status: 400 }
      );
    }

    if (exam.schedules.length === 0) {
      return NextResponse.json(
        { error: "Cannot publish exam without schedules" },
        { status: 400 }
      );
    }

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        status: "SCHEDULED",
        publishedAt: new Date(),
        publishedBy: user.id,
      },
      include: {
        academicYear: true,
        schedules: {
          include: {
            subject: true,
            academicUnit: true,
          },
        },
      },
    });

    // TODO: Send notifications to students and parents

    return NextResponse.json({
      success: true,
      message: "Exam published successfully",
      data: updatedExam,
    });
  } catch (error: any) {
    console.error("Error publishing exam:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish exam" },
      { status: 500 }
    );
  }
}
