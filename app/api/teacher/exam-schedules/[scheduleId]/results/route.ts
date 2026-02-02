import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scheduleId } = params;

    // Get schedule with results
    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        academicUnit: {
          select: {
            name: true,
          },
        },
        results: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                admissionNumber: true,
                rollNumber: true,
              },
            },
          },
          orderBy: {
            student: {
              rollNumber: "asc",
            },
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        schedule: {
          id: schedule.id,
          exam: schedule.exam,
          subject: schedule.subject,
          academicUnit: schedule.academicUnit,
          maxMarks: schedule.maxMarks,
          passingMarks: schedule.passingMarks,
        },
        results: schedule.results.map((result) => ({
          id: result.id,
          studentId: result.studentId,
          student: result.student,
          marksObtained: result.marksObtained,
          percentage: result.percentage,
          grade: result.grade,
          isPassed: result.isPassed,
          isAbsent: result.isAbsent,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching schedule results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
