import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const hallTicketUpdateSchema = z.object({
  examCenter: z.string().optional(),
  roomNumber: z.string().optional(),
  seatNumber: z.string().optional(),
  reportingTime: z.string().optional(),
  instructions: z.string().optional(),
});

// GET - Fetch single hall ticket details
export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string; hallTicketId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hallTicketId } = params;

    const hallTicket = await prisma.examHallTicket.findUnique({
      where: { id: hallTicketId },
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
    });

    if (!hallTicket) {
      return NextResponse.json({ error: "Hall ticket not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: hallTicket,
    });
  } catch (error) {
    console.error("Error fetching hall ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch hall ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Update hall ticket information (Teacher/Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { examId: string; hallTicketId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and admins can edit
    if (!["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { hallTicketId } = params;
    const body = await req.json();
    const validatedData = hallTicketUpdateSchema.parse(body);

    const hallTicket = await prisma.examHallTicket.findUnique({
      where: { id: hallTicketId },
    });

    if (!hallTicket) {
      return NextResponse.json({ error: "Hall ticket not found" }, { status: 404 });
    }

    if (hallTicket.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    
    if (validatedData.examCenter !== undefined) {
      updateData.examCenter = validatedData.examCenter;
    }
    if (validatedData.roomNumber !== undefined) {
      updateData.roomNumber = validatedData.roomNumber;
    }
    if (validatedData.seatNumber !== undefined) {
      updateData.seatNumber = validatedData.seatNumber;
    }
    if (validatedData.reportingTime !== undefined) {
      updateData.reportingTime = new Date(validatedData.reportingTime);
    }
    if (validatedData.instructions !== undefined) {
      updateData.instructions = validatedData.instructions;
    }

    const updatedHallTicket = await prisma.examHallTicket.update({
      where: { id: hallTicketId },
      data: updateData,
      include: {
        student: {
          select: {
            fullName: true,
            admissionNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Hall ticket updated successfully",
      data: updatedHallTicket,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating hall ticket:", error);
    return NextResponse.json(
      { error: "Failed to update hall ticket" },
      { status: 500 }
    );
  }
}
