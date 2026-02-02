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
        { error: "Only admins can publish results" },
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
        results: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.status === "RESULTS_PUBLISHED") {
      return NextResponse.json(
        { error: "Results already published" },
        { status: 400 }
      );
    }

    // Check if all marks are submitted (not in draft)
    const draftResults = exam.results.filter((r) => r.isDraft);
    if (draftResults.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot publish results. ${draftResults.length} marks entries are still in draft`,
        },
        { status: 400 }
      );
    }

    // Calculate ranks if enabled
    if (exam.showRank) {
      await calculateRanks(examId);
    }

    // Generate analytics
    await generateExamAnalytics(examId, exam.schoolId);

    // Update exam status
    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        status: "RESULTS_PUBLISHED",
        resultsPublishedAt: new Date(),
        resultsPublishedBy: user.id,
      },
    });

    // Log the activity
    await prisma.marksEntryLog.create({
      data: {
        examId,
        action: "RESULTS_PUBLISHED",
        entityType: "EXAM",
        entityId: examId,
        description: "Exam results published",
        performedBy: user.id,
        performedAt: new Date(),
      },
    });

    // TODO: Send notifications to students and parents

    return NextResponse.json({
      success: true,
      message: "Results published successfully",
      data: updatedExam,
    });
  } catch (error: any) {
    console.error("Error publishing results:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish results" },
      { status: 500 }
    );
  }
}

async function calculateRanks(examId: string) {
  // Get all academic units for this exam
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { targetClasses: true },
  });

  if (!exam) return;

  const targetClasses = exam.targetClasses as string[];

  for (const academicUnitId of targetClasses) {
    // Get all students' total marks for this class
    const results = await prisma.examResult.findMany({
      where: {
        examId,
        student: {
          academicUnitId,
        },
        isAbsent: false,
      },
      include: {
        student: true,
      },
    });

    // Group by student and calculate total
    const studentTotals = new Map<string, { studentId: string; total: number }>();

    for (const result of results) {
      const current = studentTotals.get(result.studentId) || {
        studentId: result.studentId,
        total: 0,
      };
      current.total += result.marksObtained || 0;
      studentTotals.set(result.studentId, current);
    }

    // Sort by total marks
    const sorted = Array.from(studentTotals.values()).sort(
      (a, b) => b.total - a.total
    );

    // Assign ranks
    for (let i = 0; i < sorted.length; i++) {
      const rank = i + 1;
      await prisma.examResult.updateMany({
        where: {
          examId,
          studentId: sorted[i].studentId,
        },
        data: {
          classRank: rank,
        },
      });
    }
  }

  // Calculate overall ranks across all classes
  const allResults = await prisma.examResult.findMany({
    where: {
      examId,
      isAbsent: false,
    },
  });

  const studentTotals = new Map<string, { studentId: string; total: number }>();

  for (const result of allResults) {
    const current = studentTotals.get(result.studentId) || {
      studentId: result.studentId,
      total: 0,
    };
    current.total += result.marksObtained || 0;
    studentTotals.set(result.studentId, current);
  }

  const sorted = Array.from(studentTotals.values()).sort(
    (a, b) => b.total - a.total
  );

  for (let i = 0; i < sorted.length; i++) {
    const rank = i + 1;
    await prisma.examResult.updateMany({
      where: {
        examId,
        studentId: sorted[i].studentId,
      },
      data: {
        overallRank: rank,
      },
    });
  }
}

async function generateExamAnalytics(examId: string, schoolId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { targetClasses: true },
  });

  if (!exam) return;

  const targetClasses = exam.targetClasses as string[];

  // Generate overall analytics
  await generateAnalyticsForUnit(examId, schoolId, null, null);

  // Generate class-wise analytics
  for (const academicUnitId of targetClasses) {
    await generateAnalyticsForUnit(examId, schoolId, academicUnitId, null);

    // Get subjects for this class
    const subjects = await prisma.examSchedule.findMany({
      where: {
        examId,
        academicUnitId,
      },
      select: { subjectId: true },
      distinct: ["subjectId"],
    });

    // Generate subject-wise analytics
    for (const { subjectId } of subjects) {
      await generateAnalyticsForUnit(examId, schoolId, academicUnitId, subjectId);
    }
  }
}

async function generateAnalyticsForUnit(
  examId: string,
  schoolId: string,
  academicUnitId: string | null,
  subjectId: string | null
) {
  const where: any = {
    examId,
  };

  if (academicUnitId) {
    where.student = { academicUnitId };
  }

  if (subjectId) {
    where.subjectId = subjectId;
  }

  const results = await prisma.examResult.findMany({
    where,
  });

  const totalStudents = new Set(results.map((r) => r.studentId)).size;
  const absentStudents = results.filter((r) => r.isAbsent).length;
  const appearedStudents = totalStudents - absentStudents;
  const passedStudents = results.filter((r) => r.isPassed === true).length;
  const failedStudents = results.filter((r) => r.isPassed === false).length;

  const marks = results
    .filter((r) => !r.isAbsent && r.marksObtained !== null)
    .map((r) => r.marksObtained!);

  const highestMarks = marks.length > 0 ? Math.max(...marks) : null;
  const lowestMarks = marks.length > 0 ? Math.min(...marks) : null;
  const averageMarks =
    marks.length > 0
      ? marks.reduce((sum, m) => sum + m, 0) / marks.length
      : null;

  const sortedMarks = [...marks].sort((a, b) => a - b);
  const medianMarks =
    sortedMarks.length > 0
      ? sortedMarks.length % 2 === 0
        ? (sortedMarks[sortedMarks.length / 2 - 1] +
            sortedMarks[sortedMarks.length / 2]) /
          2
        : sortedMarks[Math.floor(sortedMarks.length / 2)]
      : null;

  const percentages = results
    .filter((r) => !r.isAbsent && r.percentage !== null)
    .map((r) => r.percentage!);

  const above90 = percentages.filter((p) => p >= 90).length;
  const between75And90 = percentages.filter((p) => p >= 75 && p < 90).length;
  const between60And75 = percentages.filter((p) => p >= 60 && p < 75).length;
  const between33And60 = percentages.filter((p) => p >= 33 && p < 60).length;
  const below33 = percentages.filter((p) => p < 33).length;

  await prisma.examAnalytics.upsert({
    where: {
      examId_academicUnitId_subjectId: {
        examId,
        academicUnitId: academicUnitId || "",
        subjectId: subjectId || "",
      },
    },
    update: {
      totalStudents,
      appearedStudents,
      absentStudents,
      passedStudents,
      failedStudents,
      highestMarks,
      lowestMarks,
      averageMarks,
      medianMarks,
      above90,
      between75And90,
      between60And75,
      between33And60,
      below33,
      calculatedAt: new Date(),
    },
    create: {
      schoolId,
      examId,
      academicUnitId,
      subjectId,
      totalStudents,
      appearedStudents,
      absentStudents,
      passedStudents,
      failedStudents,
      highestMarks,
      lowestMarks,
      averageMarks,
      medianMarks,
      above90,
      between75And90,
      between60And75,
      between33And60,
      below33,
    },
  });
}
