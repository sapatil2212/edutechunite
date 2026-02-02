import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for student exam summary
const summarySchema = z.object({
  studentId: z.string(),
  subjectId: z.string().optional(),
  overallPerformance: z.enum(["EXCELLENT", "GOOD", "AVERAGE", "BELOW_AVERAGE", "POOR"]),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  recommendations: z.string().optional(),
  behaviorRemarks: z.string().optional(),
  preparednessRating: z.number().min(1).max(5).optional(),
  participationRating: z.number().min(1).max(5).optional(),
  disciplineRating: z.number().min(1).max(5).optional(),
});

// POST - Create or update student exam summary
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
    const body = await req.json();

    // Only teachers can create summaries
    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create student exam summaries" },
        { status: 403 }
      );
    }

    // Validate input
    const validatedData = summarySchema.parse(body);

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: session.user.id,
        schoolId: session.user.schoolId,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Verify exam exists and belongs to teacher's school
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
    });

    if (!student || student.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Create or update summary
    const summary = await prisma.studentExamSummary.upsert({
      where: {
        examId_studentId_subjectId: {
          examId: examId,
          studentId: validatedData.studentId,
          subjectId: validatedData.subjectId || null,
        },
      },
      create: {
        schoolId: session.user.schoolId!,
        examId: examId,
        studentId: validatedData.studentId,
        subjectId: validatedData.subjectId,
        teacherId: teacher.id,
        overallPerformance: validatedData.overallPerformance,
        strengths: validatedData.strengths,
        weaknesses: validatedData.weaknesses,
        recommendations: validatedData.recommendations,
        behaviorRemarks: validatedData.behaviorRemarks,
        preparednessRating: validatedData.preparednessRating,
        participationRating: validatedData.participationRating,
        disciplineRating: validatedData.disciplineRating,
      },
      update: {
        overallPerformance: validatedData.overallPerformance,
        strengths: validatedData.strengths,
        weaknesses: validatedData.weaknesses,
        recommendations: validatedData.recommendations,
        behaviorRemarks: validatedData.behaviorRemarks,
        preparednessRating: validatedData.preparednessRating,
        participationRating: validatedData.participationRating,
        disciplineRating: validatedData.disciplineRating,
        updatedAt: new Date(),
      },
      include: {
        student: {
          select: {
            fullName: true,
            admissionNumber: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            fullName: true,
          },
        },
      },
    });

    // Create notification for student and parents
    const studentWithGuardians = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: {
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (studentWithGuardians) {
      const notifications = [
        // Notification to student
        {
          schoolId: session.user.schoolId!,
          examId: examId,
          type: "MARKS_PUBLISHED" as const,
          title: "Exam Summary Available",
          message: `Your teacher has added performance summary for the exam. Check your dashboard for details.`,
          recipientType: "STUDENT",
          recipientId: studentWithGuardians.userId || studentWithGuardians.id,
          sendEmail: false,
          sendInApp: true,
        },
        // Notifications to parents
        ...studentWithGuardians.guardians.map((sg) => ({
          schoolId: session.user.schoolId!,
          examId: examId,
          type: "MARKS_PUBLISHED" as const,
          title: "Exam Summary Available",
          message: `Performance summary for ${studentWithGuardians.fullName} has been added by the teacher.`,
          recipientType: "PARENT",
          recipientId: sg.guardian.userId || sg.guardianId,
          sendEmail: false,
          sendInApp: true,
        })),
      ];

      await prisma.examNotification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Student exam summary saved successfully",
      data: summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error saving student exam summary:", error);
    return NextResponse.json(
      { error: "Failed to save student exam summary" },
      { status: 500 }
    );
  }
}

// GET - Fetch student exam summaries
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
    const teacherId = searchParams.get("teacherId");

    // Build where clause
    const where: any = {
      examId: examId,
      schoolId: session.user.schoolId,
    };

    if (studentId) {
      where.studentId = studentId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    // If user is a teacher, only show their summaries
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: {
          userId: session.user.id,
          schoolId: session.user.schoolId,
        },
      });

      if (teacher) {
        where.teacherId = teacher.id;
      }
    }

    const summaries = await prisma.studentExamSummary.findMany({
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
                name: true,
              },
            },
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        teacher: {
          select: {
            fullName: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: summaries,
    });
  } catch (error) {
    console.error("Error fetching student exam summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch student exam summaries" },
      { status: 500 }
    );
  }
}
