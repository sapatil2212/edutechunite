import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Generate admit cards for all students in the timetable's class
export async function POST(
  req: NextRequest,
  { params }: { params: { timetableId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { timetableId } = params;

    // Get the timetable with its academic unit and slots
    const timetable = await prisma.examTimetable.findUnique({
      where: { id: timetableId },
      include: {
        academicUnit: true,
        slots: {
          where: { type: "EXAM" },
          include: {
            subject: true,
          },
          orderBy: { examDate: "asc" },
        },
        school: true,
      },
    });

    if (!timetable) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }

    if (timetable.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Timetable must be published before generating admit cards" },
        { status: 400 }
      );
    }

    // Get all sections (child academic units) of this class
    const sections = await prisma.academicUnit.findMany({
      where: {
        parentId: timetable.academicUnitId,
      },
      select: { id: true },
    });

    // Build list of academic unit IDs to search for students
    // Include both the class itself and all its sections
    const academicUnitIds = [
      timetable.academicUnitId,
      ...sections.map((s) => s.id),
    ];

    // Get all students in the academic unit or its sections
    const students = await prisma.student.findMany({
      where: {
        academicUnitId: { in: academicUnitIds },
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        academicUnit: {
          select: {
            name: true,
          },
        },
      },
    });

    if (students.length === 0) {
      return NextResponse.json(
        { error: "No active students found in this class or its sections" },
        { status: 400 }
      );
    }

    // Get class teacher for signature
    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        academicUnitId: timetable.academicUnitId,
        academicYearId: timetable.academicYearId,
        isPrimary: true,
        isActive: true,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    // Get principal
    const principal = await prisma.user.findFirst({
      where: {
        schoolId: timetable.schoolId,
        role: "SCHOOL_ADMIN",
      },
      select: {
        fullName: true,
      },
    });

    // Delete existing admit cards for this timetable
    await prisma.admitCard.deleteMany({
      where: { timetableId },
    });

    // Generate seat numbers and hall ticket numbers (random but unique)
    const seatNumbers = generateSeatNumbers(students.length);
    const hallTicketNumbers = generateHallTicketNumbers(students.length, timetable.examName);

    // Build exam schedule instructions
    const examScheduleText = timetable.slots.map((slot: { examDate: Date; subject: { name: string } | null; startTime: string; endTime: string }) => 
      `${new Date(slot.examDate).toLocaleDateString()} - ${slot.subject?.name || "Subject"} (${slot.startTime} - ${slot.endTime})`
    ).join("\n");

    // Create admit cards for each student
    const admitCards = await Promise.all(
      students.map(async (student, index) => {
        const admitCard = await prisma.admitCard.create({
          data: {
            timetableId,
            studentId: student.id,
            hallTicketNo: hallTicketNumbers[index],
            seatNumber: seatNumbers[index],
            examCenter: timetable.school.name,
            roomNumber: timetable.slots[0]?.room || "TBA",
            reportingTime: "30 min",
            instructions: `Exam Schedule:\n${examScheduleText}\n\nClass Teacher: ${classTeacher?.teacher.user.fullName || "Class Teacher"}\nPrincipal: ${principal?.fullName || "Principal"}`,
            generatedAt: new Date(),
          },
        });

        return admitCard;
      })
    );

    return NextResponse.json({
      success: true,
      count: admitCards.length,
      message: `${admitCards.length} admit cards generated successfully`,
    });
  } catch (error) {
    console.error("Error generating admit cards:", error);
    return NextResponse.json(
      { error: "Failed to generate admit cards" },
      { status: 500 }
    );
  }
}

// Get all admit cards for a timetable
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

    const admitCards = await prisma.admitCard.findMany({
      where: { timetableId },
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
            academicUnit: {
              select: {
                name: true,
              },
            },
          },
        },
        timetable: {
          select: {
            examName: true,
            startDate: true,
            endDate: true,
            academicUnit: {
              select: { name: true },
            },
            academicYear: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { seatNumber: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: admitCards,
    });
  } catch (error) {
    console.error("Error fetching admit cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch admit cards" },
      { status: 500 }
    );
  }
}

// Helper function to generate unique seat numbers
function generateSeatNumbers(count: number): string[] {
  const numbers: string[] = [];
  const usedNumbers = new Set<number>();

  while (numbers.length < count) {
    // Generate a random 4-digit seat number
    const num = Math.floor(1000 + Math.random() * 9000);
    if (!usedNumbers.has(num)) {
      usedNumbers.add(num);
      numbers.push(`SEAT-${num}`);
    }
  }

  return numbers;
}

// Helper function to generate unique hall ticket numbers
function generateHallTicketNumbers(count: number, examName: string): string[] {
  const prefix = examName.substring(0, 3).toUpperCase().replace(/\s/g, "");
  const year = new Date().getFullYear().toString().slice(-2);
  const numbers: string[] = [];
  const usedNumbers = new Set<number>();

  while (numbers.length < count) {
    const num = Math.floor(10000 + Math.random() * 90000);
    if (!usedNumbers.has(num)) {
      usedNumbers.add(num);
      numbers.push(`${prefix}${year}${num}`);
    }
  }

  return numbers;
}
