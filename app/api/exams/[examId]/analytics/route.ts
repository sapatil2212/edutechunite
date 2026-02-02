import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: user.schoolId,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const where: any = {
      examId,
      schoolId: user.schoolId,
    };

    if (academicUnitId) {
      where.academicUnitId = academicUnitId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    const analytics = await prisma.examAnalytics.findMany({
      where,
      orderBy: {
        calculatedAt: "desc",
      },
    });

    // If no analytics found, return empty data
    if (analytics.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overall: null,
          byClass: [],
          bySubject: [],
        },
      });
    }

    // Organize analytics data
    const overall = analytics.find(
      (a) => !a.academicUnitId && !a.subjectId
    );

    const byClass = analytics.filter(
      (a) => a.academicUnitId && !a.subjectId
    );

    const bySubject = analytics.filter((a) => a.subjectId);

    return NextResponse.json({
      success: true,
      data: {
        overall,
        byClass,
        bySubject,
      },
    });
  } catch (error: any) {
    console.error("Error fetching exam analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
