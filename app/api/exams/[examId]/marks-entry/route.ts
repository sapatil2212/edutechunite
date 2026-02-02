import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const marksEntrySchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  examScheduleId: z.string().optional(),
  marksObtained: z.number().min(0).optional(),
  theoryMarks: z.number().min(0).optional(),
  practicalMarks: z.number().min(0).optional(),
  isAbsent: z.boolean().default(false),
  remarks: z.string().optional(),
  teacherRemarks: z.string().optional(),
  graceMarks: z.number().min(0).optional(),
  graceReason: z.string().optional(),
  isDraft: z.boolean().default(true),
});

const bulkMarksEntrySchema = z.object({
  entries: z.array(marksEntrySchema),
});

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

    if (!["SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { examId } = params;
    const body = await req.json();

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: user.schoolId,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.status === "RESULTS_PUBLISHED") {
      return NextResponse.json(
        { error: "Cannot enter marks after results are published" },
        { status: 400 }
      );
    }

    // Check if bulk entry or single entry
    if (body.entries && Array.isArray(body.entries)) {
      const validatedData = bulkMarksEntrySchema.parse(body);

      const results = await prisma.$transaction(
        validatedData.entries.map((entry) => {
          const maxMarks = entry.theoryMarks && entry.practicalMarks
            ? (entry.theoryMarks || 0) + (entry.practicalMarks || 0)
            : entry.marksObtained || 0;

          const percentage = entry.isAbsent
            ? 0
            : maxMarks > 0
            ? ((entry.marksObtained || 0) / maxMarks) * 100
            : 0;

          const grade = calculateGrade(percentage, exam.gradingSystem);
          const isPassed = entry.isAbsent
            ? false
            : percentage >= (exam.overallPassingPercentage || 33);

          return prisma.examResult.upsert({
            where: {
              examId_studentId_subjectId: {
                examId,
                studentId: entry.studentId,
                subjectId: entry.subjectId,
              },
            },
            update: {
              marksObtained: entry.marksObtained,
              theoryMarks: entry.theoryMarks,
              practicalMarks: entry.practicalMarks,
              percentage,
              grade,
              isPassed,
              isAbsent: entry.isAbsent,
              remarks: entry.remarks,
              teacherRemarks: entry.teacherRemarks,
              graceMarks: entry.graceMarks || 0,
              graceReason: entry.graceReason,
              isDraft: entry.isDraft,
              enteredBy: user.id,
              enteredAt: new Date(),
              submittedAt: entry.isDraft ? null : new Date(),
              submittedBy: entry.isDraft ? null : user.id,
            },
            create: {
              examId,
              examScheduleId: entry.examScheduleId,
              studentId: entry.studentId,
              subjectId: entry.subjectId,
              maxMarks: maxMarks,
              marksObtained: entry.marksObtained,
              theoryMarks: entry.theoryMarks,
              practicalMarks: entry.practicalMarks,
              percentage,
              grade,
              isPassed,
              isAbsent: entry.isAbsent,
              remarks: entry.remarks,
              teacherRemarks: entry.teacherRemarks,
              graceMarks: entry.graceMarks || 0,
              graceReason: entry.graceReason,
              isDraft: entry.isDraft,
              enteredBy: user.id,
              enteredAt: new Date(),
              submittedAt: entry.isDraft ? null : new Date(),
              submittedBy: entry.isDraft ? null : user.id,
            },
            include: {
              student: {
                select: {
                  id: true,
                  fullName: true,
                  admissionNumber: true,
                },
              },
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          });
        })
      );

      // Log the activity
      await prisma.marksEntryLog.create({
        data: {
          examId,
          action: body.entries[0]?.isDraft ? "MARKS_ENTERED" : "MARKS_SUBMITTED",
          entityType: "EXAM_RESULT",
          entityId: examId,
          description: `Bulk marks entry for ${results.length} students`,
          performedBy: user.id,
          performedAt: new Date(),
        },
      });

      // Update exam status if needed
      if (!body.entries[0]?.isDraft && exam.status === "SCHEDULED") {
        await prisma.exam.update({
          where: { id: examId },
          data: { status: "MARKS_ENTRY_IN_PROGRESS" },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Marks entered for ${results.length} students`,
        data: results,
      });
    } else {
      const validatedData = marksEntrySchema.parse(body);

      const maxMarks = validatedData.theoryMarks && validatedData.practicalMarks
        ? (validatedData.theoryMarks || 0) + (validatedData.practicalMarks || 0)
        : validatedData.marksObtained || 0;

      const percentage = validatedData.isAbsent
        ? 0
        : maxMarks > 0
        ? ((validatedData.marksObtained || 0) / maxMarks) * 100
        : 0;

      const grade = calculateGrade(percentage, exam.gradingSystem);
      const isPassed = validatedData.isAbsent
        ? false
        : percentage >= (exam.overallPassingPercentage || 33);

      const result = await prisma.examResult.upsert({
        where: {
          examId_studentId_subjectId: {
            examId,
            studentId: validatedData.studentId,
            subjectId: validatedData.subjectId,
          },
        },
        update: {
          marksObtained: validatedData.marksObtained,
          theoryMarks: validatedData.theoryMarks,
          practicalMarks: validatedData.practicalMarks,
          percentage,
          grade,
          isPassed,
          isAbsent: validatedData.isAbsent,
          remarks: validatedData.remarks,
          teacherRemarks: validatedData.teacherRemarks,
          graceMarks: validatedData.graceMarks || 0,
          graceReason: validatedData.graceReason,
          isDraft: validatedData.isDraft,
          enteredBy: user.id,
          enteredAt: new Date(),
          submittedAt: validatedData.isDraft ? null : new Date(),
          submittedBy: validatedData.isDraft ? null : user.id,
        },
        create: {
          examId,
          examScheduleId: validatedData.examScheduleId,
          studentId: validatedData.studentId,
          subjectId: validatedData.subjectId,
          maxMarks,
          marksObtained: validatedData.marksObtained,
          theoryMarks: validatedData.theoryMarks,
          practicalMarks: validatedData.practicalMarks,
          percentage,
          grade,
          isPassed,
          isAbsent: validatedData.isAbsent,
          remarks: validatedData.remarks,
          teacherRemarks: validatedData.teacherRemarks,
          graceMarks: validatedData.graceMarks || 0,
          graceReason: validatedData.graceReason,
          isDraft: validatedData.isDraft,
          enteredBy: user.id,
          enteredAt: new Date(),
          submittedAt: validatedData.isDraft ? null : new Date(),
          submittedBy: validatedData.isDraft ? null : user.id,
        },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              admissionNumber: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Log the activity
      await prisma.marksEntryLog.create({
        data: {
          examId,
          action: validatedData.isDraft ? "MARKS_ENTERED" : "MARKS_SUBMITTED",
          entityType: "EXAM_RESULT",
          entityId: result.id,
          description: `Marks ${validatedData.isDraft ? "saved as draft" : "submitted"} for student ${result.student.fullName}`,
          performedBy: user.id,
          performedAt: new Date(),
        },
      });

      // Update exam status if needed
      if (!validatedData.isDraft && exam.status === "SCHEDULED") {
        await prisma.exam.update({
          where: { id: examId },
          data: { status: "MARKS_ENTRY_IN_PROGRESS" },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Marks entered successfully",
        data: result,
      });
    }
  } catch (error: any) {
    console.error("Error entering marks:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to enter marks" },
      { status: 500 }
    );
  }
}

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
    const { searchParams } = new URL(req.url);

    const academicUnitId = searchParams.get("academicUnitId");
    const subjectId = searchParams.get("subjectId");
    const studentId = searchParams.get("studentId");
    const isDraft = searchParams.get("isDraft");

    const where: any = {
      examId,
      exam: {
        schoolId: user.schoolId,
      },
    };

    if (academicUnitId) {
      where.student = {
        academicUnitId,
      };
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (isDraft !== null) {
      where.isDraft = isDraft === "true";
    }

    const results = await prisma.examResult.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
            academicUnit: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        examSchedule: {
          select: {
            id: true,
            maxMarks: true,
            passingMarks: true,
          },
        },
      },
      orderBy: [
        { student: { rollNumber: "asc" } },
        { student: { fullName: "asc" } },
      ],
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error("Error fetching marks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch marks" },
      { status: 500 }
    );
  }
}

// Helper function to calculate grade
function calculateGrade(percentage: number, gradingSystem: any): string | null {
  if (!gradingSystem) return null;

  for (const [grade, range] of Object.entries(gradingSystem)) {
    const { min, max } = range as any;
    if (percentage >= min && percentage <= max) {
      return grade;
    }
  }

  return null;
}
