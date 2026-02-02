import { prisma } from "@/lib/prisma";
import { sendEmail } from "./email-service";

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  sendEmail?: boolean;
  sendSMS?: boolean;
}

export class NotificationService {
  /**
   * Send notification to a single user
   */
  static async sendToUser(data: NotificationData) {
    try {
      // Create in-app notification
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
        },
      });

      // Send email if requested
      if (data.sendEmail) {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { email: true, fullName: true },
        });

        if (user) {
          await sendEmail({
            to: user.email,
            subject: data.title,
            html: this.getEmailTemplate(data.title, data.message, user.fullName),
          });
        }
      }

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users (batch)
   */
  static async sendToMultipleUsers(userIds: string[], data: Omit<NotificationData, "userId">) {
    try {
      const notifications = await Promise.all(
        userIds.map((userId) =>
          this.sendToUser({
            ...data,
            userId,
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error("Error sending batch notifications:", error);
      throw error;
    }
  }

  /**
   * Send exam timetable notification
   */
  static async sendExamTimetableNotification(
    timetableId: string,
    userIds: string[],
    type: "SCHEDULED" | "UPDATED" | "CANCELLED",
    timetableDetails: {
      examName: string;
      className: string;
      startDate: string;
      endDate: string;
    }
  ) {
    try {
      const titles = {
        SCHEDULED: `New Exam Scheduled: ${timetableDetails.examName}`,
        UPDATED: `Exam Updated: ${timetableDetails.examName}`,
        CANCELLED: `Exam Cancelled: ${timetableDetails.examName}`,
      };

      const messages = {
        SCHEDULED: `${timetableDetails.examName} has been scheduled for ${timetableDetails.className} from ${timetableDetails.startDate} to ${timetableDetails.endDate}. Please check your exam timetable for details.`,
        UPDATED: `${timetableDetails.examName} for ${timetableDetails.className} has been updated. Please review the latest timetable.`,
        CANCELLED: `${timetableDetails.examName} for ${timetableDetails.className} has been cancelled.`,
      };

      // Create timetable-specific notifications
      const notifications = await prisma.examTimetableNotification.createMany({
        data: userIds.map((userId) => ({
          timetableId,
          userId,
          type: `EXAM_${type}`,
          title: titles[type],
          message: messages[type],
          sentViaApp: true,
          sentViaEmail: false,
        })),
      });

      // Send in-app notifications
      await this.sendToMultipleUsers(userIds, {
        type: `EXAM_${type}`,
        title: titles[type],
        message: messages[type],
        entityType: "EXAM_TIMETABLE",
        entityId: timetableId,
        sendEmail: true,
      });

      return notifications;
    } catch (error) {
      console.error("Error sending exam timetable notification:", error);
      throw error;
    }
  }

  /**
   * Send result published notification
   */
  static async sendResultPublishedNotification(
    examId: string,
    studentIds: string[],
    examName: string
  ) {
    try {
      await this.sendToMultipleUsers(studentIds, {
        type: "RESULTS_PUBLISHED",
        title: `Results Published: ${examName}`,
        message: `Your results for ${examName} have been published. Check your dashboard to view your performance.`,
        entityType: "EXAM",
        entityId: examId,
        sendEmail: true,
      });
    } catch (error) {
      console.error("Error sending result notification:", error);
      throw error;
    }
  }

  /**
   * Send report card available notification
   */
  static async sendReportCardNotification(
    studentIds: string[],
    examName: string,
    reportCardUrl?: string
  ) {
    try {
      await this.sendToMultipleUsers(studentIds, {
        type: "REPORT_CARD_AVAILABLE",
        title: `Report Card Available: ${examName}`,
        message: `Your report card for ${examName} is now available for download.${
          reportCardUrl ? ` Download it from your dashboard.` : ""
        }`,
        entityType: "REPORT_CARD",
        entityId: examName,
        sendEmail: true,
      });
    } catch (error) {
      console.error("Error sending report card notification:", error);
      throw error;
    }
  }

  /**
   * Get email template
   */
  private static getEmailTemplate(title: string, message: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📚 Education ERP</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>
              <div class="message">
                <h2 style="color: #667eea; margin-top: 0;">${title}</h2>
                <p>${message}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/dashboard" class="button">
                View Dashboard
              </a>
              <div class="footer">
                <p>This is an automated notification from your Education ERP system.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    try {
      return await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, limit = 20) {
    try {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string) {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }
}
