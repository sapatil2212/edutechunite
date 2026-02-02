import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for marking attendance
const attendanceSchema = z.object({
  examScheduleId: z.string(),
  studentId: z.string(),
  isPresent: z.boolean(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  lateArrival: z.boolean().optional(),
  earlyDeparture: z.boolean().optional(),
  remarks: z.string().optional(),
});

const bulkAttendanceSchema = z.object({
  examScheduleId: z.string(),
  attendances: z.array(
    z.object({
      studentId: z.string(),
      isPresent: z.boolean(),
      arrivalTime: z.string().optional(),
      departureTime: z.string().optional(),
      lateArrival: z.boolean().optional(),
      earlyDeparture: z.boolean().optional(),
      remarks: z.string().optional(),
    })
  ),
});

// POST - Mark attendance (single or bulk)
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

    // Check if user has permission (TEACHER or ADMIN)
    if (!["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if it's bulk or single attendance
    const isBulk = Array.isArray(body.attendances);

    if (isBulk) {
      // Validate bulk attendance
      const validatedData = bulkAttendanceSchema.parse(body);

      // Verify exam schedule exists
      const examSchedule = await prisma.examSchedule.findUnique({
        where: { id: validatedData.examScheduleId },
        include: { exam: true },
      });

      if (!examSchedule || examSchedule.examId !== examId) {
        return NextResponse.json(
          { error: "Exam schedule not found" },
          { status: 404 }
        );
      }

      if (examSchedule.exam.schoolId !== session.user.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Bulk upsert attendance records
      const attendanceRecords = await Promise.all(
        validatedData.attendances.map(async (attendance) => {
          return prisma.examAttendance.upsert({
            where: {
              examScheduleId_studentId: {
                examScheduleId: validatedData.examScheduleId,
                studentId: attendance.studentId,
              },
            },
            create: {
              schoolId: session.user.schoolId!,
              examId: examId,
              examScheduleId: validatedData.examScheduleId,
              studentId: attendance.studentId,
              isPresent: attendance.isPresent,
              arrivalTime: attendance.arrivalTime ? new Date(attendance.arrivalTime) : null,
              departureTime: attendance.departureTime ? new Date(attendance.departureTime) : null,
              lateArrival: attendance.lateArrival || false,
              earlyDeparture: attendance.earlyDeparture || false,
              remarks: attendance.remarks,
              markedBy: session.user.id,
            },
            update: {
              isPresent: attendance.isPresent,
              arrivalTime: attendance.arrivalTime ? new Date(attendance.arrivalTime) : null,
              departureTime: attendance.departureTime ? new Date(attendance.departureTime) : null,
              lateArrival: attendance.lateArrival || false,
              earlyDeparture: attendance.earlyDeparture || false,
              remarks: attendance.remarks,
              markedBy: session.user.id,
              updatedAt: new Date(),
            },
          });
        })
      );

      // Send notifications to absent students
      const absentStudents = validatedData.attendances.filter((a) => !a.isPresent);
      if (absentStudents.length > 0) {
        const students = await prisma.student.findMany({
          where: {
            id: { in: absentStudents.map((a) => a.studentId) },
          },
          include: {
            guardians: {
              include: {
                guardian: true,
              },
            },
          },
        });

        const notifications = students.flatMap((student) => [
          // Notification to student
          {
            schoolId: session.user.schoolId!,
            examId: examId,
            type: "ATTENDANCE_MARKED" as const,
            title: "Exam Attendance: Absent",
            message: `You were marked absent for the exam. Please contact your teacher if this is incorrect.`,
            recipientType: "STUDENT",
            recipientId: student.userId || student.id,
            sendEmail: true,
            sendInApp: true,
          },
          // Notifications to parents
          ...student.guardians.map((sg) => ({
            schoolId: session.user.schoolId!,
            examId: examId,
            type: "ATTENDANCE_MARKED" as const,
            title: "Exam Attendance Alert",
            message: `${student.fullName} was marked absent for the exam. Please contact the school for more information.`,
            recipientType: "PARENT",
            recipientId: sg.guardian.userId || sg.guardianId,
            sendEmail: true,
            sendInApp: true,
          })),
        ]);

        await prisma.examNotification.createMany({
          data: notifications,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Attendance marked successfully",
        data: {
          totalMarked: attendanceRecords.length,
          present: validatedData.attendances.filter((a) => a.isPresent).length,
          absent: absentStudents.length,
        },
      });
    } else {
      // Single attendance
      const validatedData = attendanceSchema.parse(body);

      // Verify exam schedule exists
      const examSchedule = await prisma.examSchedule.findUnique({
        where: { id: validatedData.examScheduleId },
        include: { exam: true },
      });

      if (!examSchedule || examSchedule.examId !== examId) {
        return NextResponse.json(
          { error: "Exam schedule not found" },
          { status: 404 }
        );
      }

      if (examSchedule.exam.schoolId !== session.user.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Upsert attendance record
      const attendance = await prisma.examAttendance.upsert({
        where: {
          examScheduleId_studentId: {
            examScheduleId: validatedData.examScheduleId,
            studentId: validatedData.studentId,
          },
        },
        create: {
          schoolId: session.user.schoolId!,
          examId: examId,
          examScheduleId: validatedData.examScheduleId,
          studentId: validatedData.studentId,
          isPresent: validatedData.isPresent,
          arrivalTime: validatedData.arrivalTime ? new Date(validatedData.arrivalTime) : null,
          departureTime: validatedData.departureTime ? new Date(validatedData.departureTime) : null,
          lateArrival: validatedData.lateArrival || false,
          earlyDeparture: validatedData.earlyDeparture || false,
          remarks: validatedData.remarks,
          markedBy: session.user.id,
        },
        update: {
          isPresent: validatedData.isPresent,
          arrivalTime: validatedData.arrivalTime ? new Date(validatedData.arrivalTime) : null,
          departureTime: validatedData.departureTime ? new Date(validatedData.departureTime) : null,
          lateArrival: validatedData.lateArrival || false,
          earlyDeparture: validatedData.earlyDeparture || false,
          remarks: validatedData.remarks,
          markedBy: session.user.id,
          updatedAt: new Date(),
        },
        include: {
          student: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Attendance marked successfully",
        data: attendance,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}

// GET - Fetch attendance records
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
    const examScheduleId = searchParams.get("examScheduleId");
    const academicUnitId = searchParams.get("academicUnitId");

    // Build where clause
    const where: any = {
      examId: examId,
      schoolId: session.user.schoolId,
    };

    if (examScheduleId) {
      where.examScheduleId = examScheduleId;
    }

    if (academicUnitId) {
      where.student = {
        academicUnitId: academicUnitId,
      };
    }

    const attendance = await prisma.examAttendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
          },
        },
        examSchedule: {
          select: {
            id: true,
            examDate: true,
            startTime: true,
            endTime: true,
            subject: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        markedAt: "desc",
      },
    });

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter((a) => a.isPresent).length,
      absent: attendance.filter((a) => !a.isPresent).length,
      lateArrivals: attendance.filter((a) => a.lateArrival).length,
      earlyDepartures: attendance.filter((a) => a.earlyDeparture).length,
    };

    return NextResponse.json({
      success: true,
      data: attendance,
      stats,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
