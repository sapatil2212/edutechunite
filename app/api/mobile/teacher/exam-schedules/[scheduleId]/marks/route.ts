import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

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
    const body = await req.json();
    const validatedData = marksEntrySchema.parse(body);

    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        exam: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: "Schedule not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (schedule.marksEntryStatus === "LOCKED") {
      return NextResponse.json(
        { success: false, error: "Marks entry is locked for this exam" },
        { status: 403, headers: corsHeaders }
      );
    }

    const results = [];
    for (const mark of validatedData.marks) {
      const percentage = (mark.marksObtained / schedule.maxMarks) * 100;
      const isPassed = mark.isAbsent ? false : mark.marksObtained >= schedule.passingMarks;

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
          schoolId: schoolId!,
          marksObtained: mark.marksObtained,
          percentage,
          grade,
          isPassed,
          isAbsent: mark.isAbsent || false,
          isDraft: validatedData.isDraft || false,
          enteredBy: userId,
        },
        update: {
          marksObtained: mark.marksObtained,
          percentage,
          grade,
          isPassed,
          isAbsent: mark.isAbsent || false,
          isDraft: validatedData.isDraft || false,
          enteredBy: userId,
          updatedAt: new Date(),
        },
      });

      results.push(result);
    }

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

    return NextResponse.json(
      {
        success: true,
        message: validatedData.isDraft ? "Marks saved as draft" : "Marks submitted successfully",
        data: {
          totalProcessed: results.length,
          status: newStatus,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    console.error("Error saving marks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save marks" },
      { status: 500, headers: corsHeaders }
    );
  }
}
