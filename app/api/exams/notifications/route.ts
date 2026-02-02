import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch exam notifications for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const examId = searchParams.get("examId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: any = {
      schoolId: session.user.schoolId,
      recipientId: session.user.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (examId) {
      where.examId = examId;
    }

    const notifications = await prisma.examNotification.findMany({
      where,
      include: {
        exam: {
          select: {
            id: true,
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
      take: limit,
    });

    // Count unread notifications
    const unreadCount = await prisma.examNotification.count({
      where: {
        schoolId: session.user.schoolId,
        recipientId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.examNotification.updateMany({
        where: {
          schoolId: session.user.schoolId,
          recipientId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const notification = await prisma.examNotification.update({
        where: {
          id: notificationId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } else {
      return NextResponse.json(
        { error: "Either notificationId or markAllAsRead must be provided" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
