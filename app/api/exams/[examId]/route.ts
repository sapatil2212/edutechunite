import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateExamSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  examType: z.enum([
    "UNIT_TEST",
    "MONTHLY_TEST",
    "MID_TERM",
    "FINAL",
    "PRACTICAL",
    "ORAL",
    "VIVA",
    "PROJECT",
    "ASSIGNMENT",
    "MOCK_TEST",
    "ENTRANCE_TEST",
    "INTERNAL_ASSESSMENT",
    "SEMESTER_EXAM",
    "LAB_EXAM",
    "ACTIVITY_BASED",
    "WEEKLY_TEST",
    "PRACTICE_TEST",
    "COMPETITIVE_PATTERN",
  ]).optional(),
  targetClasses: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  evaluationType: z.enum([
    "MARKS_BASED",
    "GRADE_BASED",
    "PERCENTAGE_BASED",
    "CREDIT_BASED",
    "PASS_FAIL",
    "DESCRIPTIVE",
  ]).optional(),
  examMode: z.enum(["OFFLINE", "ONLINE", "HYBRID"]).optional(),
  overallPassingPercentage: z.number().min(0).max(100).optional(),
  subjectWisePassing: z.boolean().optional(),
  gradingSystem: z.any().optional(),
  showRank: z.boolean().optional(),
  showPercentage: z.boolean().optional(),
  showGrade: z.boolean().optional(),
  allowMarksCorrection: z.boolean().optional(),
  correctionDeadline: z.string().optional(),
  weightage: z.number().min(0).max(100).optional(),
  instructions: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { examId } = params;

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: user.schoolId,
      },
      include: {
        academicYear: true,
        schedules: {
          include: {
            subject: true,
            academicUnit: true,
          },
          orderBy: {
            examDate: "asc",
          },
        },
        _count: {
          select: {
            schedules: true,
            results: true,
            reportCards: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: exam,
    });
  } catch (error: any) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch exam" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
        { error: "Only admins can update exams" },
        { status: 403 }
      );
    }

    const { examId } = params;
    const body = await req.json();
    const validatedData = updateExamSchema.parse(body);

    const existingExam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: user.schoolId,
      },
    });

    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (existingExam.status === "RESULTS_PUBLISHED") {
      return NextResponse.json(
        { error: "Cannot update exam after results are published" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.code) updateData.code = validatedData.code;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.examType) updateData.examType = validatedData.examType;
    if (validatedData.targetClasses)
      updateData.targetClasses = validatedData.targetClasses;
    if (validatedData.startDate)
      updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate)
      updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.evaluationType)
      updateData.evaluationType = validatedData.evaluationType;
    if (validatedData.examMode) updateData.examMode = validatedData.examMode;
    if (validatedData.overallPassingPercentage !== undefined)
      updateData.overallPassingPercentage =
        validatedData.overallPassingPercentage;
    if (validatedData.subjectWisePassing !== undefined)
      updateData.subjectWisePassing = validatedData.subjectWisePassing;
    if (validatedData.gradingSystem !== undefined)
      updateData.gradingSystem = validatedData.gradingSystem;
    if (validatedData.showRank !== undefined)
      updateData.showRank = validatedData.showRank;
    if (validatedData.showPercentage !== undefined)
      updateData.showPercentage = validatedData.showPercentage;
    if (validatedData.showGrade !== undefined)
      updateData.showGrade = validatedData.showGrade;
    if (validatedData.allowMarksCorrection !== undefined)
      updateData.allowMarksCorrection = validatedData.allowMarksCorrection;
    if (validatedData.correctionDeadline)
      updateData.correctionDeadline = new Date(
        validatedData.correctionDeadline
      );
    if (validatedData.weightage !== undefined)
      updateData.weightage = validatedData.weightage;
    if (validatedData.instructions !== undefined)
      updateData.instructions = validatedData.instructions;

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      message: "Exam updated successfully",
      data: updatedExam,
    });
  } catch (error: any) {
    console.error("Error updating exam:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update exam" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: "Only admins can delete exams" },
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
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam._count.results > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete exam with existing results. Archive it instead.",
        },
        { status: 400 }
      );
    }

    if (exam.status === "MARKS_ENTRY_IN_PROGRESS" || exam.status === "MARKS_ENTRY_COMPLETED") {
      return NextResponse.json(
        { error: "Cannot delete exam after marks entry has started" },
        { status: 400 }
      );
    }

    await prisma.exam.delete({
      where: { id: examId },
    });

    return NextResponse.json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete exam" },
      { status: 500 }
    );
  }
}
