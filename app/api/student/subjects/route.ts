import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student record
    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        academicUnit: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get subjects assigned to the student's academic unit (class)
    const academicUnitSubjects = await prisma.academicUnitSubject.findMany({
      where: {
        academicUnitId: student.academicUnitId,
      },
      include: {
        subject: {
          include: {
            course: {
              select: {
                name: true,
              },
            },
            teacherAssignments: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    // Transform the data to a cleaner format
    const subjects = academicUnitSubjects.map((aus: any) => {
      // Filter teachers assigned to this specific academic unit
      const assignedTeachers = aus.subject.teacherAssignments.filter((ta: any) => {
        // If academicUnitIds is null or empty, teacher is assigned to all units
        if (!ta.academicUnitIds) return true;
        
        // Check if student's academicUnitId is in the teacher's academicUnitIds array
        const unitIds = Array.isArray(ta.academicUnitIds) ? ta.academicUnitIds : [];
        return unitIds.includes(student.academicUnitId);
      });

      return {
        id: aus.subject.id,
        name: aus.subject.name,
        code: aus.subject.code,
        description: aus.subject.description,
        type: aus.subject.type,
        color: aus.subject.color,
        icon: aus.subject.icon,
        creditsPerWeek: aus.subject.creditsPerWeek,
        isElective: aus.isElective,
        course: aus.subject.course,
        teachers: assignedTeachers.map((ta: any) => ({
          id: ta.teacher.id,
          name: ta.teacher.fullName,
          email: ta.teacher.email,
          phone: ta.teacher.phone,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        academicUnit: student.academicUnit,
        subjects: subjects,
      },
    });
  } catch (error) {
    console.error("Error fetching student subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
