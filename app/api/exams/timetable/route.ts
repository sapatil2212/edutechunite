import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VisibilityService } from "@/lib/services/visibility-service";
import { AuditLogger } from "@/lib/services/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SCHOOL_ADMIN" && session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      academicYearId,
      academicUnitId,
      classId,
      className,
      sectionId,
      sectionName,
      examName,
      description,
      startDate,
      endDate,
      status,
      slots,
    } = body;

    // Validate required fields
    if (!academicYearId || !academicUnitId || !examName || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create timetable - always create as DRAFT first, then publish if needed
    const timetable = await prisma.examTimetable.create({
      data: {
        schoolId: session.user.schoolId!,
        academicYearId,
        academicUnitId,
        classId: classId || null,
        className: className || null,
        sectionId: sectionId || null,
        sectionName: sectionName || null,
        examName,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "DRAFT",
        createdBy: session.user.id,
      },
    });

    // Create slots
    if (slots && slots.length > 0) {
      await prisma.examTimetableSlot.createMany({
        data: slots.map((slot: any) => ({
          timetableId: timetable.id,
          slotOrder: slot.slotOrder,
          examDate: new Date(slot.examDate),
          startTime: slot.startTime,
          endTime: slot.endTime,
          subjectId: slot.subjectId || null,
          maxMarks: slot.maxMarks || null,
          minMarks: slot.minMarks || null,
          supervisorId: slot.supervisorId || null,
          supervisorName: slot.supervisorName || null,
          type: slot.type,
          room: slot.room || null,
          instructions: slot.instructions || null,
        })),
      });
    }

    // Log creation
    await AuditLogger.logTimetableCreated(
      session.user.schoolId!,
      timetable.id,
      session.user.id,
      { examName, academicUnitId, startDate, endDate }
    );

    // If published, trigger visibility and notifications
    if (status === "PUBLISHED") {
      try {
        await VisibilityService.publishTimetable(timetable.id, session.user.id);
      } catch (publishError) {
        console.error("Error publishing timetable:", publishError);
        // Timetable was created but publishing failed - return success with warning
        return NextResponse.json({
          success: true,
          data: timetable,
          message: "Timetable created but publishing notifications failed. You can publish it later.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: timetable,
      message: status === "PUBLISHED"
        ? "Timetable published and notifications sent"
        : "Timetable saved as draft",
    });
  } catch (error) {
    console.error("Error creating timetable:", error);
    return NextResponse.json(
      { error: "Failed to create timetable" },
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

    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId");
    const academicUnitId = searchParams.get("academicUnitId");
    const status = searchParams.get("status");

    const where: any = {
      schoolId: session.user.schoolId!,
    };

    if (academicYearId) where.academicYearId = academicYearId;
    if (academicUnitId) where.academicUnitId = academicUnitId;
    if (status) where.status = status;

    const timetables = await prisma.examTimetable.findMany({
      where,
      include: {
        academicYear: {
          select: { name: true },
        },
        academicUnit: {
          select: { name: true },
        },
        creator: {
          select: { fullName: true },
        },
        _count: {
          select: {
            slots: true,
            admitCards: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: timetables,
    });
  } catch (error) {
    console.error("Error fetching timetables:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetables" },
      { status: 500 }
    );
  }
}
