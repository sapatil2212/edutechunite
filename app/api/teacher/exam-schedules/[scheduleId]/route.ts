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

    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: {
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
        exam: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("Error fetching exam schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam schedule" },
      { status: 500 }
    );
  }
}
