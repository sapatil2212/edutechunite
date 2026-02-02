import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createExamSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
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
  ]),
  academicYearId: z.string(),
  courseId: z.string().optional(),
  targetClasses: z.array(z.string()).min(1, "At least one class must be selected"),
  startDate: z.string(),
  endDate: z.string(),
  evaluationType: z.enum([
    "MARKS_BASED",
    "GRADE_BASED",
    "PERCENTAGE_BASED",
    "CREDIT_BASED",
    "PASS_FAIL",
    "DESCRIPTIVE",
  ]).default("MARKS_BASED"),
  examMode: z.enum(["OFFLINE", "ONLINE", "HYBRID"]).default("OFFLINE"),
  overallPassingPercentage: z.number().min(0).max(100).optional(),
  subjectWisePassing: z.boolean().default(true),
  gradingSystem: z.any().optional(),
  showRank: z.boolean().default(false),
  showPercentage: z.boolean().default(true),
  showGrade: z.boolean().default(true),
  allowMarksCorrection: z.boolean().default(false),
  correctionDeadline: z.string().optional(),
  weightage: z.number().min(0).max(100).optional(),
  instructions: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    if (!["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only admins can create exams" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createExamSchema.parse(body);

    const exam = await prisma.exam.create({
      data: {
        schoolId: user.schoolId,
        academicYearId: validatedData.academicYearId,
        courseId: validatedData.courseId,
        targetClasses: validatedData.targetClasses,
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        examType: validatedData.examType,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        evaluationType: validatedData.evaluationType,
        examMode: validatedData.examMode,
        overallPassingPercentage: validatedData.overallPassingPercentage || 33,
        subjectWisePassing: validatedData.subjectWisePassing,
        gradingSystem: validatedData.gradingSystem,
        showRank: validatedData.showRank,
        showPercentage: validatedData.showPercentage,
        showGrade: validatedData.showGrade,
        allowMarksCorrection: validatedData.allowMarksCorrection,
        correctionDeadline: validatedData.correctionDeadline
          ? new Date(validatedData.correctionDeadline)
          : null,
        weightage: validatedData.weightage || 100,
        instructions: validatedData.instructions,
        status: "DRAFT",
        createdBy: user.id,
      },
      include: {
        academicYear: true,
        schedules: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (error: any) {
    console.error("Error creating exam:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create exam" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);

    const academicYearId = searchParams.get("academicYearId");
    const status = searchParams.get("status");
    const examType = searchParams.get("examType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId: user.schoolId,
    };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    if (status) {
      where.status = status;
    }

    if (examType) {
      where.examType = examType;
    }

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          academicYear: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          schedules: {
            select: {
              id: true,
              examDate: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              academicUnit: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              schedules: true,
              results: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.exam.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: exams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch exams" },
      { status: 500 }
    );
  }
}
