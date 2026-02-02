import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createScheduleSchema = z.object({
  subjectId: z.string(),
  academicUnitId: z.string(),
  examDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number().optional(),
  room: z.string().optional(),
  center: z.string().optional(),
  maxMarks: z.number().min(1).default(100),
  passingMarks: z.number().min(0).default(33),
  theoryMarks: z.number().optional(),
  practicalMarks: z.number().optional(),
  supervisorId: z.string().optional(),
  invigilators: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

const bulkCreateScheduleSchema = z.object({
  schedules: z.array(createScheduleSchema),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    if (!["SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { examId } = params;
    const body = await req.json();

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        schoolId: user.schoolId,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.status === "RESULTS_PUBLISHED") {
      return NextResponse.json(
        { error: "Cannot modify schedules after results are published" },
        { status: 400 }
      );
    }

    // Check if bulk create or single create
    if (body.schedules && Array.isArray(body.schedules)) {
      const validatedData = bulkCreateScheduleSchema.parse(body);

      // Validate no overlapping schedules
      for (const schedule of validatedData.schedules) {
        const existing = await prisma.examSchedule.findFirst({
          where: {
            examId,
            subjectId: schedule.subjectId,
            academicUnitId: schedule.academicUnitId,
          },
        });

        if (existing) {
          return NextResponse.json(
            {
              error: `Schedule already exists for this subject and class`,
            },
            { status: 400 }
          );
        }

        // Check for time conflicts
        const conflicts = await prisma.examSchedule.findMany({
          where: {
            academicUnitId: schedule.academicUnitId,
            examDate: new Date(schedule.examDate),
            OR: [
              {
                AND: [
                  { startTime: { lte: schedule.startTime } },
                  { endTime: { gt: schedule.startTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: schedule.endTime } },
                  { endTime: { gte: schedule.endTime } },
                ],
              },
            ],
          },
        });

        if (conflicts.length > 0) {
          return NextResponse.json(
            {
              error: `Time conflict detected for ${schedule.examDate} at ${schedule.startTime}`,
            },
            { status: 400 }
          );
        }
      }

      const createdSchedules = await prisma.$transaction(
        validatedData.schedules.map((schedule) =>
          prisma.examSchedule.create({
            data: {
              examId,
              subjectId: schedule.subjectId,
              academicUnitId: schedule.academicUnitId,
              examDate: new Date(schedule.examDate),
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              duration: schedule.duration,
              room: schedule.room,
              center: schedule.center,
              maxMarks: schedule.maxMarks,
              passingMarks: schedule.passingMarks,
              theoryMarks: schedule.theoryMarks,
              practicalMarks: schedule.practicalMarks,
              supervisorId: schedule.supervisorId,
              invigilators: schedule.invigilators,
              instructions: schedule.instructions,
            },
            include: {
              subject: true,
              academicUnit: true,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        message: `${createdSchedules.length} schedules created successfully`,
        data: createdSchedules,
      });
    } else {
      const validatedData = createScheduleSchema.parse(body);

      const existing = await prisma.examSchedule.findFirst({
        where: {
          examId,
          subjectId: validatedData.subjectId,
          academicUnitId: validatedData.academicUnitId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Schedule already exists for this subject and class" },
          { status: 400 }
        );
      }

      // Check for time conflicts
      const conflicts = await prisma.examSchedule.findMany({
        where: {
          academicUnitId: validatedData.academicUnitId,
          examDate: new Date(validatedData.examDate),
          OR: [
            {
              AND: [
                { startTime: { lte: validatedData.startTime } },
                { endTime: { gt: validatedData.startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: validatedData.endTime } },
                { endTime: { gte: validatedData.endTime } },
              ],
            },
          ],
        },
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: "Time conflict detected with existing schedule" },
          { status: 400 }
        );
      }

      const schedule = await prisma.examSchedule.create({
        data: {
          examId,
          subjectId: validatedData.subjectId,
          academicUnitId: validatedData.academicUnitId,
          examDate: new Date(validatedData.examDate),
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          duration: validatedData.duration,
          room: validatedData.room,
          center: validatedData.center,
          maxMarks: validatedData.maxMarks,
          passingMarks: validatedData.passingMarks,
          theoryMarks: validatedData.theoryMarks,
          practicalMarks: validatedData.practicalMarks,
          supervisorId: validatedData.supervisorId,
          invigilators: validatedData.invigilators,
          instructions: validatedData.instructions,
        },
        include: {
          subject: true,
          academicUnit: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Schedule created successfully",
        data: schedule,
      });
    }
  } catch (error: any) {
    console.error("Error creating exam schedule:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { examId } = params;
    const { searchParams } = new URL(req.url);
    const academicUnitId = searchParams.get("academicUnitId");

    const where: any = {
      examId,
      exam: {
        schoolId: user.schoolId,
      },
    };

    if (academicUnitId) {
      where.academicUnitId = academicUnitId;
    }

    const schedules = await prisma.examSchedule.findMany({
      where,
      include: {
        subject: true,
        academicUnit: true,
        exam: {
          select: {
            id: true,
            name: true,
            examType: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: [{ examDate: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error: any) {
    console.error("Error fetching exam schedules:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}
