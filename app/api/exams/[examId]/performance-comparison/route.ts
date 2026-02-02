import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch performance comparison for students
export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { examId } = params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");

    const where: any = {
      currentExamId: examId,
      schoolId: session.user.schoolId,
    };

    if (studentId) {
      where.studentId = studentId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    const comparisons = await prisma.examPerformanceComparison.findMany({
      where,
      include: {
        student: {
          select: {
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        currentExam: {
          select: {
            name: true,
            code: true,
          },
        },
        previousExam: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: comparisons,
    });
  } catch (error) {
    console.error("Error fetching performance comparison:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance comparison" },
      { status: 500 }
    );
  }
}

// POST - Generate performance comparison
export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { examId } = params;

    // Check if user has permission
    if (!["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current exam results
    const currentExamResults = await prisma.examResult.findMany({
      where: {
        examId: examId,
        schoolId: session.user.schoolId,
        isDraft: false,
      },
      include: {
        student: true,
        subject: true,
        exam: true,
      },
    });

    if (currentExamResults.length === 0) {
      return NextResponse.json(
        { error: "No results found for current exam" },
        { status: 404 }
      );
    }

    // Get previous exam of same type for comparison
    const currentExam = currentExamResults[0].exam;
    const previousExam = await prisma.exam.findFirst({
      where: {
        schoolId: session.user.schoolId,
        examType: currentExam.examType,
        startDate: { lt: currentExam.startDate },
        status: "RESULTS_PUBLISHED",
      },
      orderBy: {
        startDate: "desc",
      },
    });

    let comparisons = [];

    for (const currentResult of currentExamResults) {
      let previousResult = null;
      let marksImprovement = null;
      let percentageImprovement = null;
      let rankImprovement = null;
      let trend = "STABLE";

      if (previousExam) {
        previousResult = await prisma.examResult.findFirst({
          where: {
            examId: previousExam.id,
            studentId: currentResult.studentId,
            subjectId: currentResult.subjectId,
            isDraft: false,
          },
        });

        if (previousResult) {
          marksImprovement = currentResult.marksObtained - previousResult.marksObtained;
          percentageImprovement = currentResult.percentage - previousResult.percentage;
          
          if (currentResult.classRank && previousResult.classRank) {
            rankImprovement = previousResult.classRank - currentResult.classRank; // Positive means improved
          }

          if (percentageImprovement > 5) {
            trend = "IMPROVING";
          } else if (percentageImprovement < -5) {
            trend = "DECLINING";
          }
        }
      }

      // Determine performance level
      let performanceLevel = "AVERAGE";
      if (currentResult.percentage >= 90) {
        performanceLevel = "EXCELLENT";
      } else if (currentResult.percentage >= 75) {
        performanceLevel = "GOOD";
      } else if (currentResult.percentage < 50) {
        performanceLevel = "NEEDS_IMPROVEMENT";
      }

      // Generate recommendations
      let recommendations = "";
      if (trend === "DECLINING") {
        recommendations = "Student performance is declining. Additional support and practice recommended.";
      } else if (trend === "IMPROVING") {
        recommendations = "Student is showing improvement. Continue with current study methods.";
      } else if (performanceLevel === "NEEDS_IMPROVEMENT") {
        recommendations = "Student needs focused attention and remedial classes.";
      }

      const comparison = await prisma.examPerformanceComparison.upsert({
        where: {
          studentId_subjectId_currentExamId: {
            studentId: currentResult.studentId,
            subjectId: currentResult.subjectId,
            currentExamId: examId,
          },
        },
        create: {
          schoolId: session.user.schoolId!,
          studentId: currentResult.studentId,
          subjectId: currentResult.subjectId,
          currentExamId: examId,
          currentMarks: currentResult.marksObtained,
          currentPercentage: currentResult.percentage,
          previousExamId: previousExam?.id,
          previousMarks: previousResult?.marksObtained,
          previousPercentage: previousResult?.percentage,
          marksImprovement,
          percentageImprovement,
          rankImprovement,
          trend,
          performanceLevel,
          recommendations,
        },
        update: {
          currentMarks: currentResult.marksObtained,
          currentPercentage: currentResult.percentage,
          previousExamId: previousExam?.id,
          previousMarks: previousResult?.marksObtained,
          previousPercentage: previousResult?.percentage,
          marksImprovement,
          percentageImprovement,
          rankImprovement,
          trend,
          performanceLevel,
          recommendations,
        },
      });

      comparisons.push(comparison);
    }

    return NextResponse.json({
      success: true,
      message: "Performance comparison generated successfully",
      data: {
        totalComparisons: comparisons.length,
        improving: comparisons.filter((c) => c.trend === "IMPROVING").length,
        declining: comparisons.filter((c) => c.trend === "DECLINING").length,
        stable: comparisons.filter((c) => c.trend === "STABLE").length,
      },
    });
  } catch (error) {
    console.error("Error generating performance comparison:", error);
    return NextResponse.json(
      { error: "Failed to generate performance comparison" },
      { status: 500 }
    );
  }
}
