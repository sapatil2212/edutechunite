import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const marksEntrySchema = z.object({
  marks: z.array(
    z.object({
      studentId: z.string(),
      marksObtained: z.number().min(0),
      isAbsent: z.boolean().optional(),
    })
  ),
  isDraft: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { scheduleId } = params;
    const body = await req.json();
    const validatedData = marksEntrySchema.parse(body);

    // Get schedule details
    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        exam: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Check if marks entry is locked
    if (schedule.marksEntryStatus === "LOCKED") {
      return NextResponse.json(
        { error: "Marks entry is locked for this exam" },
        { status: 403 }
      );
    }

    // Process marks entry
    const results = [];
    for (const mark of validatedData.marks) {
      const percentage = (mark.marksObtained / schedule.maxMarks) * 100;
      const isPassed = mark.isAbsent ? false : mark.marksObtained >= schedule.passingMarks;

      // Calculate grade (simple grading logic)
      let grade = "F";
      if (!mark.isAbsent) {
        if (percentage >= 90) grade = "A+";
        else if (percentage >= 80) grade = "A";
        else if (percentage >= 70) grade = "B+";
        else if (percentage >= 60) grade = "B";
        else if (percentage >= 50) grade = "C";
        else if (percentage >= 40) grade = "D";
      }

      const result = await prisma.examResult.upsert({
        where: {
          examScheduleId_studentId: {
            examScheduleId: scheduleId,
            studentId: mark.studentId,
          },
        },
        create: {
          examId: schedule.examId,
          examScheduleId: scheduleId,
          studentId: mark.studentId,
          subjectId: schedule.subjectId,
          academicUnitId: schedule.academicUnitId,
          schoolId: session.user.schoolId!,
          marksObtained: mark.marksObtained,
          percentage,
          grade,
          isPassed,
          isAbsent: mark.isAbsent || false,
          isDraft: validatedData.isDraft || false,
          enteredBy: session.user.id,
        },
        update: {
          marksObtained: mark.marksObtained,
          percentage,
          grade,
          isPassed,
          isAbsent: mark.isAbsent || false,
          isDraft: validatedData.isDraft || false,
          enteredBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      results.push(result);
    }

    // Update schedule marks entry status
    const allMarksEntered = validatedData.marks.length > 0;
    const newStatus = validatedData.isDraft
      ? "IN_PROGRESS"
      : allMarksEntered
      ? "COMPLETED"
      : "IN_PROGRESS";

    await prisma.examSchedule.update({
      where: { id: scheduleId },
      data: {
        marksEntryStatus: newStatus,
        marksEntryCompletedAt: !validatedData.isDraft ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: validatedData.isDraft ? "Marks saved as draft" : "Marks submitted successfully",
      data: {
        totalProcessed: results.length,
        status: newStatus,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error saving marks:", error);
    return NextResponse.json(
      { error: "Failed to save marks" },
      { status: 500 }
    );
  }
}
