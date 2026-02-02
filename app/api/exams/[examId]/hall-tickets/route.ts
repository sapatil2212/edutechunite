import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// POST - Generate hall tickets for exam
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
    const { studentId, generateForAll } = body;

    // Check if user has permission
    if (!["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch exam
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        schedules: {
          include: {
            subject: true,
            academicUnit: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let students: any[] = [];

    if (generateForAll) {
      // Generate for all students in target classes
      const targetClassIds = exam.targetClasses as string[];
      students = await prisma.student.findMany({
        where: {
          schoolId: exam.schoolId,
          academicUnitId: { in: targetClassIds },
          status: "ACTIVE",
        },
        include: {
          academicUnit: true,
        },
      });
    } else if (studentId) {
      // Generate for specific student
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          academicUnit: true,
        },
      });

      if (!student || student.schoolId !== exam.schoolId) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      students = [student];
    } else {
      return NextResponse.json(
        { error: "Either studentId or generateForAll must be provided" },
        { status: 400 }
      );
    }

    // Generate hall tickets
    const hallTickets = await Promise.all(
      students.map(async (student, index) => {
        // Generate unique hall ticket number
        const hallTicketNumber = `${exam.code}-${student.admissionNumber}-${Date.now()}`;

        // Generate QR code data (in production, use a QR code library)
        const qrCodeData = JSON.stringify({
          examId: exam.id,
          studentId: student.id,
          hallTicketNumber,
        });

        return prisma.examHallTicket.upsert({
          where: {
            examId_studentId: {
              examId: exam.id,
              studentId: student.id,
            },
          },
          create: {
            schoolId: exam.schoolId,
            examId: exam.id,
            studentId: student.id,
            hallTicketNumber,
            examCenter: exam.schedules[0]?.center || "Main Campus",
            roomNumber: exam.schedules[0]?.room,
            seatNumber: `S-${(index + 1).toString().padStart(3, "0")}`,
            instructions: `1. Report 30 minutes before exam time\n2. Bring valid ID proof\n3. No electronic devices allowed\n4. Follow exam center rules`,
            reportingTime: new Date(exam.startDate.getTime() - 30 * 60000), // 30 mins before
            isGenerated: true,
            generatedAt: new Date(),
            qrCode: qrCodeData,
          },
          update: {
            examCenter: exam.schedules[0]?.center || "Main Campus",
            roomNumber: exam.schedules[0]?.room,
            seatNumber: `S-${(index + 1).toString().padStart(3, "0")}`,
            isGenerated: true,
            generatedAt: new Date(),
            qrCode: qrCodeData,
          },
        });
      })
    );

    // Send notifications to students
    const notifications = students.map((student) => ({
      schoolId: exam.schoolId,
      examId: exam.id,
      type: "SCHEDULE_PUBLISHED" as const,
      title: "Hall Ticket Generated",
      message: `Your hall ticket for ${exam.name} is ready. Download it from your dashboard.`,
      recipientType: "STUDENT",
      recipientId: student.userId || student.id,
      sendEmail: true,
      sendInApp: true,
      metadata: {
        hallTicketNumber: hallTickets.find((ht) => ht.studentId === student.id)?.hallTicketNumber,
      },
    }));

    await prisma.examNotification.createMany({
      data: notifications,
    });

    // Send emails
    Promise.all(
      students
        .filter((s) => s.email)
        .map((student) =>
          sendEmail({
            to: student.email!,
            subject: `Hall Ticket Generated: ${exam.name}`,
            html: `
              <h2>Hall Ticket Generated</h2>
              <p>Dear ${student.fullName},</p>
              <p>Your hall ticket for <strong>${exam.name}</strong> has been generated.</p>
              <p><strong>Hall Ticket Number:</strong> ${hallTickets.find((ht) => ht.studentId === student.id)?.hallTicketNumber}</p>
              <p>Please log in to your dashboard to download your hall ticket.</p>
              <p><strong>Important Instructions:</strong></p>
              <ul>
                <li>Report 30 minutes before exam time</li>
                <li>Bring valid ID proof</li>
                <li>No electronic devices allowed</li>
              </ul>
            `,
          }).catch((err) => console.error("Email error:", err))
        )
    );

    return NextResponse.json({
      success: true,
      message: "Hall tickets generated successfully",
      data: {
        totalGenerated: hallTickets.length,
        hallTickets,
      },
    });
  } catch (error) {
    console.error("Error generating hall tickets:", error);
    return NextResponse.json(
      { error: "Failed to generate hall tickets" },
      { status: 500 }
    );
  }
}

// GET - Fetch hall tickets
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
    const studentId = searchParams.get("studentId");

    const where: any = {
      examId: examId,
      schoolId: session.user.schoolId,
    };

    // If student, only show their hall ticket
    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: {
          userId: session.user.id,
          schoolId: session.user.schoolId,
        },
      });

      if (student) {
        where.studentId = student.id;
      }
    } else if (studentId) {
      where.studentId = studentId;
    }

    const hallTickets = await prisma.examHallTicket.findMany({
      where,
      include: {
        student: {
          select: {
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
            profilePhoto: true,
            academicUnit: {
              select: {
                name: true,
              },
            },
          },
        },
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

// PATCH - Download hall ticket (track downloads)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { hallTicketId } = body;

    const hallTicket = await prisma.examHallTicket.update({
      where: { id: hallTicketId },
      data: {
        isDownloaded: true,
        downloadedAt: new Date(),
        downloadCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Download tracked successfully",
      data: hallTicket,
    });
  } catch (error) {
    console.error("Error tracking download:", error);
    return NextResponse.json(
      { error: "Failed to track download" },
      { status: 500 }
    );
  }
}
