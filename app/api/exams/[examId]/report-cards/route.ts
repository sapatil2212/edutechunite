import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const generateReportCardSchema = z.object({
  studentId: z.string().optional(),
  academicUnitId: z.string().optional(),
  reportCardType: z.enum([
    "EXAM_WISE",
    "TERM_WISE",
    "ANNUAL",
    "PROGRESS_REPORT",
    "TRANSCRIPT",
  ]).default("EXAM_WISE"),
  includeAttendance: z.boolean().default(true),
  includeRemarks: z.boolean().default(true),
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

    if (!["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only admins can generate report cards" },
        { status: 403 }
      );
    }

    const { examId } = params;
    const body = await req.json();
    const validatedData = generateReportCardSchema.parse(body);

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: user.schoolId,
      },
      include: {
        academicYear: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.status !== "RESULTS_PUBLISHED") {
      return NextResponse.json(
        { error: "Results must be published before generating report cards" },
        { status: 400 }
      );
    }

    let studentIds: string[] = [];

    if (validatedData.studentId) {
      studentIds = [validatedData.studentId];
    } else if (validatedData.academicUnitId) {
      const students = await prisma.student.findMany({
        where: {
          schoolId: user.schoolId,
          academicUnitId: validatedData.academicUnitId,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      studentIds = students.map((s) => s.id);
    } else {
      return NextResponse.json(
        { error: "Either studentId or academicUnitId must be provided" },
        { status: 400 }
      );
    }

    const reportCards = [];

    for (const studentId of studentIds) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          academicUnit: true,
          academicYear: true,
        },
      });

      if (!student) continue;

      // Get exam results for this student
      const results = await prisma.examResult.findMany({
        where: {
          examId,
          studentId,
        },
        include: {
          subject: true,
          examSchedule: true,
        },
        orderBy: {
          subject: {
            displayOrder: "asc",
          },
        },
      });

      // Prepare results data
      const resultsData = {
        subjects: results.map((r) => ({
          subjectId: r.subjectId,
          subjectName: r.subject.name,
          subjectCode: r.subject.code,
          maxMarks: r.maxMarks,
          marksObtained: r.marksObtained,
          theoryMarks: r.theoryMarks,
          practicalMarks: r.practicalMarks,
          percentage: r.percentage,
          grade: r.grade,
          isPassed: r.isPassed,
          isAbsent: r.isAbsent,
          remarks: r.remarks,
          classRank: r.classRank,
        })),
        totalMaxMarks: results.reduce((sum, r) => sum + r.maxMarks, 0),
        totalMarksObtained: results.reduce(
          (sum, r) => sum + (r.marksObtained || 0),
          0
        ),
        overallPercentage:
          results.length > 0
            ? (results.reduce((sum, r) => sum + (r.marksObtained || 0), 0) /
                results.reduce((sum, r) => sum + r.maxMarks, 0)) *
              100
            : 0,
        totalSubjects: results.length,
        subjectsPassed: results.filter((r) => r.isPassed).length,
        subjectsFailed: results.filter((r) => r.isPassed === false).length,
        classRank: results[0]?.classRank || null,
        overallRank: results[0]?.overallRank || null,
      };

      // Get attendance data if requested
      let attendanceData = null;
      if (validatedData.includeAttendance) {
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            studentId,
            academicYearId: exam.academicYearId,
            date: {
              gte: exam.startDate,
              lte: exam.endDate,
            },
          },
        });

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(
          (a) => a.status === "PRESENT"
        ).length;
        const absentDays = attendanceRecords.filter(
          (a) => a.status === "ABSENT"
        ).length;

        attendanceData = {
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage:
            totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
        };
      }

      // Get remarks data if requested
      let remarksData = null;
      if (validatedData.includeRemarks) {
        remarksData = {
          teacherRemarks: results
            .filter((r) => r.teacherRemarks)
            .map((r) => ({
              subject: r.subject.name,
              remarks: r.teacherRemarks,
            })),
          principalRemarks: null, // TODO: Add principal remarks functionality
        };
      }

      // Create report card record
      const reportCard = await prisma.reportCard.create({
        data: {
          schoolId: user.schoolId,
          studentId,
          examId,
          academicYearId: exam.academicYearId,
          academicUnitId: student.academicUnitId,
          reportCardType: validatedData.reportCardType,
          title: `${exam.name} - Report Card`,
          reportPeriod: `${exam.academicYear.name}`,
          resultsData,
          attendanceData,
          remarksData,
          status: "GENERATED",
          generatedAt: new Date(),
          generatedBy: user.id,
        },
      });

      reportCards.push(reportCard);
    }

    return NextResponse.json({
      success: true,
      message: `${reportCards.length} report card(s) generated successfully`,
      data: reportCards,
    });
  } catch (error: any) {
    console.error("Error generating report cards:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate report cards" },
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

    const studentId = searchParams.get("studentId");
    const academicUnitId = searchParams.get("academicUnitId");

    const where: any = {
      examId,
      schoolId: user.schoolId,
    };

    if (studentId) {
      where.studentId = studentId;
    }

    if (academicUnitId) {
      where.academicUnitId = academicUnitId;
    }

    const reportCards = await prisma.reportCard.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: reportCards,
    });
  } catch (error: any) {
    console.error("Error fetching report cards:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch report cards" },
      { status: 500 }
    );
  }
}
