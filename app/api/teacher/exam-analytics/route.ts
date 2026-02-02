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
          include: {
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const subjectIds = teacher.subjectAssignments.map((a) => a.subjectId);

    // Get all results for teacher's subjects
    const results = await prisma.examResult.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        schoolId: session.user.schoolId!,
        isDraft: false,
      },
      include: {
        subject: true,
        student: true,
      },
    });

    // Calculate overall stats
    const totalExams = new Set(results.map((r) => r.examId)).size;
    const totalStudentsEvaluated = new Set(results.map((r) => r.studentId)).size;
    const passedResults = results.filter((r) => r.isPassed && !r.isAbsent);
    const presentResults = results.filter((r) => !r.isAbsent);
    const overallPassPercentage = presentResults.length > 0
      ? (passedResults.length / presentResults.length) * 100
      : 0;
    const overallAverageMarks = presentResults.length > 0
      ? presentResults.reduce((sum, r) => sum + r.marksObtained, 0) / presentResults.length
      : 0;

    // Calculate subject-wise analytics
    const subjectAnalytics = teacher.subjectAssignments.map((assignment) => {
      const subjectResults = results.filter((r) => r.subjectId === assignment.subjectId);
      const subjectPresent = subjectResults.filter((r) => !r.isAbsent);
      const subjectPassed = subjectResults.filter((r) => r.isPassed && !r.isAbsent);

      const passPercentage = subjectPresent.length > 0
        ? (subjectPassed.length / subjectPresent.length) * 100
        : 0;
      const avgMarks = subjectPresent.length > 0
        ? subjectPresent.reduce((sum, r) => sum + r.marksObtained, 0) / subjectPresent.length
        : 0;

      // Simple trend calculation (compare with average)
      const trend = passPercentage > overallPassPercentage ? "up" : passPercentage < overallPassPercentage ? "down" : "stable";
      const trendValue = Math.abs(passPercentage - overallPassPercentage);

      return {
        subjectId: assignment.subjectId,
        subjectName: assignment.subject.name,
        subjectCode: assignment.subject.code,
        totalExams: new Set(subjectResults.map((r) => r.examId)).size,
        averagePassPercentage: passPercentage,
        averageMarks: avgMarks,
        trend,
        trendValue,
      };
    });

    // Find top and bottom performing subjects
    const sortedSubjects = [...subjectAnalytics].sort(
      (a, b) => b.averagePassPercentage - a.averagePassPercentage
    );
    const topPerformingSubject = sortedSubjects[0]?.subjectName || "";
    const needsImprovementSubject = sortedSubjects[sortedSubjects.length - 1]?.subjectName || "";

    // Get top performers (students with highest average marks)
    const studentMarks: { [key: string]: { total: number; count: number; student: any } } = {};
    results.filter((r) => !r.isAbsent).forEach((result) => {
      if (!studentMarks[result.studentId]) {
        studentMarks[result.studentId] = {
          total: 0,
          count: 0,
          student: result.student,
        };
      }
      studentMarks[result.studentId].total += result.marksObtained;
      studentMarks[result.studentId].count += 1;
    });

    const topPerformers = Object.entries(studentMarks)
      .map(([studentId, data]) => ({
        studentId,
        studentName: data.student.fullName,
        admissionNumber: data.student.admissionNumber,
        averageMarks: data.total / data.count,
        totalExams: data.count,
      }))
      .sort((a, b) => b.averageMarks - a.averageMarks)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      overallStats: {
        totalExams,
        totalStudentsEvaluated,
        overallPassPercentage,
        overallAverageMarks,
        topPerformingSubject,
        needsImprovementSubject,
      },
      subjectAnalytics,
      topPerformers,
    });
  } catch (error) {
    console.error("Error fetching exam analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
