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

    const results = await prisma.examResult.findMany({
      where: {
        studentId: student.id,
        isDraft: false,
        examSchedule: {
          exam: {
            status: "RESULTS_PUBLISHED",
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
        examSchedule: {
          select: {
            maxMarks: true,
            exam: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam results" },
      { status: 500 }
    );
  }
}
