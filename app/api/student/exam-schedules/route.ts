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

    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
        schoolId: session.user.schoolId,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const schedules = await prisma.examSchedule.findMany({
      where: {
        academicUnitId: student.academicUnitId,
        exam: {
          schoolId: session.user.schoolId!,
          status: {
            in: ["SCHEDULED", "ONGOING"],
          },
        },
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        exam: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        examDate: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error("Error fetching exam schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam schedules" },
      { status: 500 }
    );
  }
}
