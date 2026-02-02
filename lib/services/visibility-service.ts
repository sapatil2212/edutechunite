import { prisma } from "@/lib/prisma";
import { NotificationService } from "./notification-service";
import { AuditLogger } from "./audit-logger";

export class VisibilityService {
  /**
   * Make exam timetable visible to all relevant users on publish
   */
  static async publishTimetable(timetableId: string, publishedBy: string) {
    try {
      // Get timetable details
      const timetable = await prisma.examTimetable.findUnique({
        where: { id: timetableId },
        include: {
          academicUnit: {
            include: {
              students: {
                where: { status: "ACTIVE" },
                select: { id: true, userId: true },
              },
            },
          },
          slots: {
            where: { type: "EXAM" },
            include: {
              subject: true,
              supervisor: {
                select: { id: true, userId: true },
              },
            },
          },
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!timetable) {
        throw new Error("Timetable not found");
      }

      if (timetable.status === "PUBLISHED") {
        throw new Error("Timetable is already published");
      }

      // Update timetable status
      await prisma.examTimetable.update({
        where: { id: timetableId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          publishedBy,
        },
      });

      // Collect all user IDs who should be notified
      const userIds = new Set<string>();

      // 1. Add all students in the class
      timetable.academicUnit.students.forEach((student) => {
        if (student.userId) userIds.add(student.userId);
      });

      // 2. Add all subject teachers
      const subjectTeacherIds = new Set<string>();
      timetable.slots.forEach((slot) => {
        if (slot.supervisor?.userId) {
          userIds.add(slot.supervisor.userId);
          subjectTeacherIds.add(slot.supervisor.userId);
        }
      });

      // 3. Add class teacher
      const classTeacher = await prisma.classTeacher.findFirst({
        where: {
          academicUnitId: timetable.academicUnitId,
          academicYearId: timetable.academicYearId,
          isPrimary: true,
          isActive: true,
        },
        include: {
          teacher: {
            select: { userId: true },
          },
        },
      });

      if (classTeacher?.teacher.userId) {
        userIds.add(classTeacher.teacher.userId);
      }

      // 4. Get all parent/guardian user IDs
      const guardianRelations = await prisma.studentGuardian.findMany({
        where: {
          studentId: {
            in: timetable.academicUnit.students.map((s) => s.id),
          },
        },
        include: {
          guardian: {
            select: { userId: true },
          },
        },
      });

      guardianRelations.forEach((relation) => {
        if (relation.guardian.userId) {
          userIds.add(relation.guardian.userId);
        }
      });

      // Send notifications to all users
      const userIdArray = Array.from(userIds);
      
      await NotificationService.sendExamTimetableNotification(
        timetableId,
        userIdArray,
        "SCHEDULED",
        {
          examName: timetable.examName,
          className: timetable.academicUnit.name,
          startDate: new Date(timetable.startDate).toLocaleDateString(),
          endDate: new Date(timetable.endDate).toLocaleDateString(),
        }
      );

      // Auto-generate admit cards for all students
      await this.generateAdmitCards(timetable);

      // Log the publish action
      await AuditLogger.logTimetablePublished(
        timetable.schoolId,
        timetableId,
        publishedBy
      );

      return {
        success: true,
        notifiedUsers: userIdArray.length,
        students: timetable.academicUnit.students.length,
        teachers: subjectTeacherIds.size,
      };
    } catch (error) {
      console.error("Error publishing timetable:", error);
      throw error;
    }
  }

  /**
   * Auto-generate admit cards for all students
   */
  static async generateAdmitCards(timetable: any) {
    try {
      const students = timetable.academicUnit.students;

      // Generate hall ticket numbers
      const admitCards = students.map((student: any, index: number) => {
        const hallTicketNo = `${timetable.school.id.substring(0, 4).toUpperCase()}-${
          timetable.academicUnit.name.replace(/\s/g, "").substring(0, 3).toUpperCase()
        }-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`;

        return {
          timetableId: timetable.id,
          studentId: student.id,
          hallTicketNo,
          examCenter: timetable.school.name,
          reportingTime: timetable.slots[0]?.startTime
            ? `${timetable.slots[0].startTime.split(":")[0]}:00`
            : "08:00",
        };
      });

      // Bulk create admit cards
      await prisma.admitCard.createMany({
        data: admitCards,
        skipDuplicates: true,
      });

      return admitCards.length;
    } catch (error) {
      console.error("Error generating admit cards:", error);
      throw error;
    }
  }

  /**
   * Update timetable and notify users
   */
  static async updateAndNotify(
    timetableId: string,
    updatedBy: string,
    changes: any
  ) {
    try {
      const timetable = await prisma.examTimetable.findUnique({
        where: { id: timetableId },
        include: {
          academicUnit: {
            include: {
              students: {
                where: { status: "ACTIVE" },
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!timetable) {
        throw new Error("Timetable not found");
      }

      // Get all affected users
      const userIds = timetable.academicUnit.students
        .map((s) => s.userId)
        .filter((id): id is string => id !== null);

      // Send update notification
      await NotificationService.sendExamTimetableNotification(
        timetableId,
        userIds,
        "UPDATED",
        {
          examName: timetable.examName,
          className: timetable.academicUnit.name,
          startDate: new Date(timetable.startDate).toLocaleDateString(),
          endDate: new Date(timetable.endDate).toLocaleDateString(),
        }
      );

      return { success: true, notifiedUsers: userIds.length };
    } catch (error) {
      console.error("Error updating and notifying:", error);
      throw error;
    }
  }

  /**
   * Cancel timetable and notify users
   */
  static async cancelAndNotify(timetableId: string, cancelledBy: string) {
    try {
      const timetable = await prisma.examTimetable.findUnique({
        where: { id: timetableId },
        include: {
          academicUnit: {
            include: {
              students: {
                where: { status: "ACTIVE" },
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!timetable) {
        throw new Error("Timetable not found");
      }

      // Update status to cancelled
      await prisma.examTimetable.update({
        where: { id: timetableId },
        data: { status: "CANCELLED" },
      });

      // Get all affected users
      const userIds = timetable.academicUnit.students
        .map((s) => s.userId)
        .filter((id): id is string => id !== null);

      // Send cancellation notification
      await NotificationService.sendExamTimetableNotification(
        timetableId,
        userIds,
        "CANCELLED",
        {
          examName: timetable.examName,
          className: timetable.academicUnit.name,
          startDate: new Date(timetable.startDate).toLocaleDateString(),
          endDate: new Date(timetable.endDate).toLocaleDateString(),
        }
      );

      // Log the cancellation
      await AuditLogger.log({
        schoolId: timetable.schoolId,
        entityType: "EXAM_TIMETABLE",
        entityId: timetableId,
        action: "CANCEL",
        userId: cancelledBy,
      });

      return { success: true, notifiedUsers: userIds.length };
    } catch (error) {
      console.error("Error cancelling timetable:", error);
      throw error;
    }
  }

  /**
   * Check if user has access to timetable
   */
  static async hasAccess(userId: string, timetableId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
          teacherProfile: true,
          guardianProfile: {
            include: {
              students: {
                select: { studentId: true },
              },
            },
          },
        },
      });

      if (!user) return false;

      const timetable = await prisma.examTimetable.findUnique({
        where: { id: timetableId },
        select: {
          academicUnitId: true,
          slots: {
            select: { supervisorId: true },
          },
        },
      });

      if (!timetable) return false;

      // Admin has access to all
      if (user.role === "SCHOOL_ADMIN" || user.role === "SUPER_ADMIN") {
        return true;
      }

      // Student has access if in the class
      if (user.studentProfile) {
        return user.studentProfile.academicUnitId === timetable.academicUnitId;
      }

      // Teacher has access if supervising any slot
      if (user.teacherProfile) {
        const supervisorIds = timetable.slots.map((s) => s.supervisorId);
        return supervisorIds.includes(user.teacherProfile.id);
      }

      // Parent has access if their child is in the class
      if (user.guardianProfile) {
        const studentIds = user.guardianProfile.students.map((s) => s.studentId);
        const students = await prisma.student.findMany({
          where: {
            id: { in: studentIds },
            academicUnitId: timetable.academicUnitId,
          },
        });
        return students.length > 0;
      }

      return false;
    } catch (error) {
      console.error("Error checking access:", error);
      return false;
    }
  }
}
