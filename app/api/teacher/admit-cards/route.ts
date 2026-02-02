import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get admit cards for classes where the teacher is the class teacher
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the teacher record for this user
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher record not found" }, { status: 404 });
    }

    // Get classes where this teacher is the class teacher
    const classTeacherAssignments = await prisma.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
        isActive: true,
      },
      select: {
        academicUnitId: true,
        academicYearId: true,
      },
    });

    if (classTeacherAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No class teacher assignments found",
      });
    }

    const academicUnitIds = classTeacherAssignments.map(a => a.academicUnitId);

    // Get all timetables for these classes
    const timetables = await prisma.examTimetable.findMany({
      where: {
        academicUnitId: { in: academicUnitIds },
        status: "PUBLISHED",
      },
      include: {
        academicUnit: {
          select: { name: true },
        },
        academicYear: {
          select: { name: true },
        },
        admitCards: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { seatNumber: "asc" },
        },
        slots: {
          where: { type: "EXAM" },
          include: {
            subject: {
              select: {
                name: true,
                code: true,
              },
            },
          },
          orderBy: { examDate: "asc" },
        },
        school: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Transform the data
    const transformedData = timetables.map((timetable) => ({
      id: timetable.id,
      examName: timetable.examName,
      className: timetable.academicUnit.name,
      academicYear: timetable.academicYear.name,
      startDate: timetable.startDate,
      endDate: timetable.endDate,
      school: timetable.school,
      admitCardsCount: timetable.admitCards.length,
      examSchedule: timetable.slots.map((slot) => ({
        date: slot.examDate,
        subject: slot.subject?.name || "Subject",
        subjectCode: slot.subject?.code || "",
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxMarks: slot.maxMarks,
        room: slot.room || "TBA",
      })),
      admitCards: timetable.admitCards.map((card) => ({
        id: card.id,
        hallTicketNo: card.hallTicketNo,
        seatNumber: card.seatNumber,
        roomNumber: card.roomNumber,
        student: {
          id: card.student.id,
          name: card.student.user.fullName,
          email: card.student.user.email,
          avatar: card.student.user.avatar,
          rollNumber: card.student.rollNumber,
        },
        generatedAt: card.generatedAt,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("Error fetching teacher admit cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch admit cards" },
      { status: 500 }
    );
  }
}
