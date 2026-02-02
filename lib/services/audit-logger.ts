import { prisma } from "@/lib/prisma";

interface AuditLogData {
  schoolId: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  /**
   * Create an audit log entry
   */
  static async log(data: AuditLogData) {
    try {
      return await prisma.auditLog.create({
        data: {
          schoolId: data.schoolId,
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          userId: data.userId,
          oldValue: data.oldValue || null,
          newValue: data.newValue || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch (error) {
      console.error("Error creating audit log:", error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log exam timetable creation
   */
  static async logTimetableCreated(
    schoolId: string,
    timetableId: string,
    userId: string,
    timetableData: any
  ) {
    return this.log({
      schoolId,
      entityType: "EXAM_TIMETABLE",
      entityId: timetableId,
      action: "CREATE",
      userId,
      newValue: timetableData,
    });
  }

  /**
   * Log exam timetable update
   */
  static async logTimetableUpdated(
    schoolId: string,
    timetableId: string,
    userId: string,
    oldData: any,
    newData: any
  ) {
    return this.log({
      schoolId,
      entityType: "EXAM_TIMETABLE",
      entityId: timetableId,
      action: "UPDATE",
      userId,
      oldValue: oldData,
      newValue: newData,
    });
  }

  /**
   * Log exam timetable publish
   */
  static async logTimetablePublished(
    schoolId: string,
    timetableId: string,
    userId: string
  ) {
    return this.log({
      schoolId,
      entityType: "EXAM_TIMETABLE",
      entityId: timetableId,
      action: "PUBLISH",
      userId,
    });
  }

  /**
   * Log marks entry
   */
  static async logMarksEntry(
    schoolId: string,
    resultId: string,
    userId: string,
    marks: any
  ) {
    return this.log({
      schoolId,
      entityType: "MARKS",
      entityId: resultId,
      action: "CREATE",
      userId,
      newValue: marks,
    });
  }

  /**
   * Log marks update
   */
  static async logMarksUpdate(
    schoolId: string,
    resultId: string,
    userId: string,
    oldMarks: any,
    newMarks: any
  ) {
    return this.log({
      schoolId,
      entityType: "MARKS",
      entityId: resultId,
      action: "UPDATE",
      userId,
      oldValue: oldMarks,
      newValue: newMarks,
    });
  }

  /**
   * Log attendance marking
   */
  static async logAttendanceMarked(
    schoolId: string,
    attendanceId: string,
    userId: string,
    attendanceData: any
  ) {
    return this.log({
      schoolId,
      entityType: "EXAM_ATTENDANCE",
      entityId: attendanceId,
      action: "CREATE",
      userId,
      newValue: attendanceData,
    });
  }

  /**
   * Log report card generation
   */
  static async logReportCardGenerated(
    schoolId: string,
    reportCardId: string,
    userId: string
  ) {
    return this.log({
      schoolId,
      entityType: "REPORT_CARD",
      entityId: reportCardId,
      action: "GENERATE",
      userId,
    });
  }

  /**
   * Get audit logs for an entity
   */
  static async getEntityLogs(
    schoolId: string,
    entityType: string,
    entityId: string,
    limit = 50
  ) {
    try {
      return await prisma.auditLog.findMany({
        where: {
          schoolId,
          entityType,
          entityId,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return [];
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserLogs(schoolId: string, userId: string, limit = 50) {
    try {
      return await prisma.auditLog.findMany({
        where: {
          schoolId,
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });
    } catch (error) {
      console.error("Error fetching user logs:", error);
      return [];
    }
  }
}
