import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// POST - Send exam reminders
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can send reminders
    if (!["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { examId, reminderType, daysBeforeExam } = body;

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

    // Get all students in target classes
    const targetClassIds = exam.targetClasses as string[];
    const students = await prisma.student.findMany({
      where: {
        schoolId: exam.schoolId,
        academicUnitId: { in: targetClassIds },
        status: "ACTIVE",
      },
      include: {
        user: true,
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    // Calculate days until exam
    const daysUntilExam = Math.ceil(
      (new Date(exam.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let reminderMessage = "";
    if (daysUntilExam <= 1) {
      reminderMessage = "Your exam starts tomorrow! Make sure you are well-prepared.";
    } else if (daysUntilExam <= 3) {
      reminderMessage = `Your exam starts in ${daysUntilExam} days. Final revision time!`;
    } else if (daysUntilExam <= 7) {
      reminderMessage = `Your exam starts in ${daysUntilExam} days. Start your preparation now.`;
    } else {
      reminderMessage = `Reminder: ${exam.name} is scheduled from ${new Date(exam.startDate).toLocaleDateString()}.`;
    }

    // Create notifications for students
    const studentNotifications = students.map((student) => ({
      schoolId: exam.schoolId,
      examId: exam.id,
      type: "EXAM_REMINDER" as const,
      title: `Exam Reminder: ${exam.name}`,
      message: reminderMessage,
      recipientType: "STUDENT",
      recipientId: student.userId || student.id,
      sendEmail: true,
      sendInApp: true,
      metadata: {
        daysUntilExam,
        examStartDate: exam.startDate,
      },
    }));

    // Create notifications for parents
    const parentNotifications = students.flatMap((student) =>
      student.guardians.map((sg) => ({
        schoolId: exam.schoolId,
        examId: exam.id,
        type: "EXAM_REMINDER" as const,
        title: `Exam Reminder: ${exam.name}`,
        message: `Reminder: ${exam.name} for ${student.fullName} starts in ${daysUntilExam} days. Please ensure your ward is prepared.`,
        recipientType: "PARENT",
        recipientId: sg.guardian.userId || sg.guardianId,
        sendEmail: true,
        sendInApp: true,
        metadata: {
          studentName: student.fullName,
          daysUntilExam,
        },
      }))
    );

    // Bulk create notifications
    await prisma.examNotification.createMany({
      data: [...studentNotifications, ...parentNotifications],
    });

    // Send emails asynchronously
    Promise.all([
      // Send emails to students
      ...students
        .filter((s) => s.email)
        .map((student) =>
          sendEmail({
            to: student.email!,
            subject: `Exam Reminder: ${exam.name}`,
            html: `
              <h2>Exam Reminder</h2>
              <p>Dear ${student.fullName},</p>
              <p>${reminderMessage}</p>
              <p><strong>Exam Details:</strong></p>
              <ul>
                <li><strong>Exam:</strong> ${exam.name} (${exam.code})</li>
                <li><strong>Start Date:</strong> ${new Date(exam.startDate).toLocaleDateString()}</li>
                <li><strong>End Date:</strong> ${new Date(exam.endDate).toLocaleDateString()}</li>
                <li><strong>Days Until Exam:</strong> ${daysUntilExam} days</li>
              </ul>
              <p>Check your dashboard for the complete exam schedule.</p>
              <p>Best wishes for your preparation!</p>
            `,
          }).catch((err) => console.error("Email error:", err))
        ),
      // Send emails to parents
      ...students.flatMap((student) =>
        student.guardians
          .filter((sg) => sg.guardian.email)
          .map((sg) =>
            sendEmail({
              to: sg.guardian.email!,
              subject: `Exam Reminder: ${exam.name}`,
              html: `
                <h2>Exam Reminder</h2>
                <p>Dear Parent/Guardian,</p>
                <p>This is a reminder that ${exam.name} for ${student.fullName} starts in ${daysUntilExam} days.</p>
                <p><strong>Exam Period:</strong> ${new Date(exam.startDate).toLocaleDateString()} to ${new Date(exam.endDate).toLocaleDateString()}</p>
                <p>Please ensure your ward is well-prepared for the examinations.</p>
              `,
            }).catch((err) => console.error("Email error:", err))
          )
      ),
    ]);

    // Update email sent status
    await prisma.examNotification.updateMany({
      where: {
        examId: exam.id,
        type: "EXAM_REMINDER",
        emailSent: false,
      },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Exam reminders sent successfully",
      data: {
        remindersSent: studentNotifications.length + parentNotifications.length,
        studentsNotified: students.length,
        parentsNotified: parentNotifications.length,
        daysUntilExam,
      },
    });
  } catch (error) {
    console.error("Error sending exam reminders:", error);
    return NextResponse.json(
      { error: "Failed to send exam reminders" },
      { status: 500 }
    );
  }
}

// GET - Get scheduled reminders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    const where: any = {
      schoolId: session.user.schoolId,
      type: "EXAM_REMINDER",
    };

    if (examId) {
      where.examId = examId;
    }

    const reminders = await prisma.examNotification.findMany({
      where,
      include: {
        exam: {
          select: {
            name: true,
            code: true,
            startDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}
