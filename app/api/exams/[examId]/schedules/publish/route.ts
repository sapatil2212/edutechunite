import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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

    // Check if user has permission (SUPER_ADMIN, SCHOOL_ADMIN, or TEACHER)
    if (!["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch exam with schedules
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        schedules: {
          include: {
            subject: true,
            academicUnit: true,
          },
        },
        academicYear: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check if exam belongs to user's school
    if (exam.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if schedules exist
    if (exam.schedules.length === 0) {
      return NextResponse.json(
        { error: "Cannot publish exam without schedules" },
        { status: 400 }
      );
    }

    // Update exam status to SCHEDULED
    await prisma.exam.update({
      where: { id: examId },
      data: {
        status: "SCHEDULED",
        publishedAt: new Date(),
        publishedBy: session.user.id,
      },
    });

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

    // Get all teachers
    const teachers = await prisma.teacher.findMany({
      where: {
        schoolId: exam.schoolId,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    // Create notifications for students
    const studentNotifications = students.map((student) => ({
      schoolId: exam.schoolId,
      examId: exam.id,
      type: "SCHEDULE_PUBLISHED" as const,
      title: `Exam Schedule Published: ${exam.name}`,
      message: `The schedule for ${exam.name} (${exam.code}) has been published. Please check your exam schedule and prepare accordingly.`,
      recipientType: "STUDENT",
      recipientId: student.userId || student.id,
      sendEmail: true,
      sendInApp: true,
      metadata: {
        examName: exam.name,
        examCode: exam.code,
        startDate: exam.startDate,
        endDate: exam.endDate,
        scheduleCount: exam.schedules.length,
      },
    }));

    // Create notifications for parents
    const parentNotifications = students.flatMap((student) =>
      student.guardians.map((sg) => ({
        schoolId: exam.schoolId,
        examId: exam.id,
        type: "SCHEDULE_PUBLISHED" as const,
        title: `Exam Schedule Published: ${exam.name}`,
        message: `The schedule for ${exam.name} has been published for ${student.fullName}. Exam dates: ${new Date(exam.startDate).toLocaleDateString()} to ${new Date(exam.endDate).toLocaleDateString()}.`,
        recipientType: "PARENT",
        recipientId: sg.guardian.userId || sg.guardianId,
        sendEmail: true,
        sendInApp: true,
        metadata: {
          studentName: student.fullName,
          examName: exam.name,
          examCode: exam.code,
        },
      }))
    );

    // Create notifications for teachers
    const teacherNotifications = teachers.map((teacher) => ({
      schoolId: exam.schoolId,
      examId: exam.id,
      type: "SCHEDULE_PUBLISHED" as const,
      title: `Exam Schedule Published: ${exam.name}`,
      message: `The schedule for ${exam.name} has been published. Please review the exam schedule and prepare accordingly.`,
      recipientType: "TEACHER",
      recipientId: teacher.userId || teacher.id,
      sendEmail: true,
      sendInApp: true,
      metadata: {
        examName: exam.name,
        examCode: exam.code,
      },
    }));

    // Bulk create notifications
    await prisma.examNotification.createMany({
      data: [...studentNotifications, ...parentNotifications, ...teacherNotifications],
    });

    // Send emails asynchronously (in background)
    Promise.all([
      // Send emails to students
      ...students
        .filter((s) => s.email)
        .map((student) =>
          sendEmail({
            to: student.email!,
            subject: `Exam Schedule Published: ${exam.name}`,
            html: `
              <h2>Exam Schedule Published</h2>
              <p>Dear ${student.fullName},</p>
              <p>The schedule for <strong>${exam.name}</strong> has been published.</p>
              <p><strong>Exam Period:</strong> ${new Date(exam.startDate).toLocaleDateString()} to ${new Date(exam.endDate).toLocaleDateString()}</p>
              <p>Please log in to your dashboard to view the complete exam schedule.</p>
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
              subject: `Exam Schedule Published: ${exam.name}`,
              html: `
                <h2>Exam Schedule Published</h2>
                <p>Dear Parent/Guardian,</p>
                <p>The schedule for <strong>${exam.name}</strong> has been published for ${student.fullName}.</p>
                <p><strong>Exam Period:</strong> ${new Date(exam.startDate).toLocaleDateString()} to ${new Date(exam.endDate).toLocaleDateString()}</p>
                <p>Please ensure your ward is well-prepared for the examinations.</p>
              `,
            }).catch((err) => console.error("Email error:", err))
          )
      ),
      // Send emails to teachers
      ...teachers
        .filter((t) => t.email)
        .map((teacher) =>
          sendEmail({
            to: teacher.email!,
            subject: `Exam Schedule Published: ${exam.name}`,
            html: `
              <h2>Exam Schedule Published</h2>
              <p>Dear ${teacher.fullName},</p>
              <p>The schedule for <strong>${exam.name}</strong> has been published.</p>
              <p>Please review the exam schedule and prepare accordingly.</p>
            `,
          }).catch((err) => console.error("Email error:", err))
        ),
    ]);

    // Update email sent status
    await prisma.examNotification.updateMany({
      where: {
        examId: exam.id,
        type: "SCHEDULE_PUBLISHED",
      },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Exam schedule published successfully",
      data: {
        notificationsSent: studentNotifications.length + parentNotifications.length + teacherNotifications.length,
        studentsNotified: students.length,
        parentsNotified: parentNotifications.length,
        teachersNotified: teachers.length,
      },
    });
  } catch (error) {
    console.error("Error publishing exam schedule:", error);
    return NextResponse.json(
      { error: "Failed to publish exam schedule" },
      { status: 500 }
    );
  }
}
