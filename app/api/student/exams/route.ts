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

    // Get student record
    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
        schoolId: session.user.schoolId,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get all exams for the school and filter by targetClasses
    const allExams = await prisma.exam.findMany({
      where: {
        schoolId: session.user.schoolId!,
        academicYearId: student.academicYearId,
        status: {
          in: ["SCHEDULED", "ONGOING", "COMPLETED", "RESULTS_PUBLISHED"],
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    // Filter exams where targetClasses includes student's academicUnitId
    const exams = allExams.filter((exam) => {
      const targetClasses = exam.targetClasses as string[];
      return targetClasses && targetClasses.includes(student.academicUnitId);
    });

    return NextResponse.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error("Error fetching student exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}
