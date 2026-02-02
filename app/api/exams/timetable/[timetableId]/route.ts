import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/services/audit-logger";

export async function GET(
  req: NextRequest,
  { params }: { params: { timetableId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { timetableId } = params;

    const timetable = await prisma.examTimetable.findUnique({
      where: { id: timetableId },
      include: {
        academicYear: true,
        academicUnit: true,
        creator: {
          select: { fullName: true, email: true },
        },
        publisher: {
          select: { fullName: true, email: true },
        },
        slots: {
          include: {
            subject: true,
            supervisor: {
              select: { fullName: true },
            },
          },
          orderBy: {
            slotOrder: "asc",
          },
        },
        _count: {
          select: {
            admitCards: true,
          },
        },
      },
    });

    if (!timetable) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { timetableId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { timetableId } = params;

    // Check if timetable exists and get its details
    const timetable = await prisma.examTimetable.findUnique({
      where: { id: timetableId },
      select: {
        startDate: true,
        status: true,
        schoolId: true,
        examName: true,
      },
    });

    if (!timetable) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }

    // Safety rule: Cannot delete if exam has started
    const now = new Date();
    if (new Date(timetable.startDate) <= now) {
      return NextResponse.json(
        { error: "Cannot delete timetable after exam has started" },
        { status: 403 }
      );
    }

    // Delete timetable (cascade will delete slots and admit cards)
    await prisma.examTimetable.delete({
      where: { id: timetableId },
    });

    // Log deletion
    await AuditLogger.log({
      schoolId: timetable.schoolId,
      entityType: "EXAM_TIMETABLE",
      entityId: timetableId,
      action: "DELETE",
      userId: session.user.id,
      oldValue: { examName: timetable.examName, status: timetable.status },
    });

    return NextResponse.json({
      success: true,
      message: "Timetable deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    return NextResponse.json(
      { error: "Failed to delete timetable" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await req.json();

    // Get old data for audit
    const oldTimetable = await prisma.examTimetable.findUnique({
      where: { id: timetableId },
    });

    if (!oldTimetable) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }

    // Update timetable
    const updated = await prisma.examTimetable.update({
      where: { id: timetableId },
      data: {
        examName: body.examName,
        description: body.description,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    });

    // Log update
    await AuditLogger.logTimetableUpdated(
      session.user.schoolId!,
      timetableId,
      session.user.id,
      oldTimetable,
      updated
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Timetable updated successfully",
    });
  } catch (error) {
    console.error("Error updating timetable:", error);
    return NextResponse.json(
      { error: "Failed to update timetable" },
      { status: 500 }
    );
  }
}
