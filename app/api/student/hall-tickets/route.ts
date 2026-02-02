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

    const hallTickets = await prisma.examHallTicket.findMany({
      where: {
        studentId: student.id,
        schoolId: session.user.schoolId!,
        isGenerated: true,
      },
      include: {
        exam: {
          select: {
            name: true,
            code: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: hallTickets,
    });
  } catch (error) {
    console.error("Error fetching hall tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch hall tickets" },
      { status: 500 }
    );
  }
}
