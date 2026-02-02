import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VisibilityService } from "@/lib/services/visibility-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { timetableId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SCHOOL_ADMIN" && session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { timetableId } = params;

    const result = await VisibilityService.publishTimetable(
      timetableId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: `Timetable published successfully! ${result.notifiedUsers} users notified.`,
    });
  } catch (error: any) {
    console.error("Error publishing timetable:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish timetable" },
      { status: 500 }
    );
  }
}
