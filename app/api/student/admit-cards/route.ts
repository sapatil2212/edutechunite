import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get admit cards for the logged-in student
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the student record for this user
    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    // Get all admit cards for this student
    const admitCards = await prisma.admitCard.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        timetable: {
          include: {
            academicUnit: {
              select: { name: true },
            },
            academicYear: {
              select: { name: true },
            },
            school: {
              select: {
                name: true,
                address: true,
                phone: true,
                email: true,
              },
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
          },
        },
      },
      orderBy: { generatedAt: "desc" },
    });

    // Transform the data to include exam schedule
    const transformedCards = admitCards.map((card) => ({
      id: card.id,
      hallTicketNo: card.hallTicketNo,
      seatNumber: card.seatNumber,
      examCenter: card.examCenter,
      roomNumber: card.roomNumber,
      reportingTime: card.reportingTime,
      instructions: card.instructions,
      generatedAt: card.generatedAt,
      timetable: {
        id: card.timetable.id,
        examName: card.timetable.examName,
        startDate: card.timetable.startDate,
        endDate: card.timetable.endDate,
        className: card.timetable.academicUnit.name,
        academicYear: card.timetable.academicYear.name,
        school: card.timetable.school,
      },
      examSchedule: card.timetable.slots.map((slot) => ({
        date: slot.examDate,
        subject: slot.subject?.name || "Subject",
        subjectCode: slot.subject?.code || "",
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxMarks: slot.maxMarks,
        room: slot.room || card.roomNumber || "TBA",
      })),
    }));

    return NextResponse.json({
      success: true,
      data: transformedCards,
    });
  } catch (error) {
    console.error("Error fetching student admit cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch admit cards" },
      { status: 500 }
    );
  }
}
