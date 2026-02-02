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

    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get all fee assignments for the student
    const studentFees = await prisma.studentFee.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        feeStructure: {
          include: {
            academicYear: {
              select: {
                name: true,
              },
            },
            components: {
              select: {
                id: true,
                name: true,
                amount: true,
                feeType: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            paidAt: "desc",
          },
        },
        discounts: {
          select: {
            id: true,
            name: true,
            discountType: true,
            discountAmount: true,
          },
        },
        scholarships: {
          select: {
            id: true,
            name: true,
            scholarshipType: true,
            scholarshipAmount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate summary
    const summary = {
      totalFees: studentFees.reduce((sum, fee) => sum + fee.finalAmount, 0),
      totalPaid: studentFees.reduce((sum, fee) => sum + fee.paidAmount, 0),
      totalPending: studentFees.reduce((sum, fee) => sum + fee.balanceAmount, 0),
      totalDiscount: studentFees.reduce((sum, fee) => sum + fee.discountAmount, 0),
      totalScholarship: studentFees.reduce((sum, fee) => sum + fee.scholarshipAmount, 0),
    };

    // Get all payments for detailed history
    const allPayments = await prisma.payment.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        studentFee: {
          include: {
            feeStructure: {
              select: {
                name: true,
                academicYear: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.fullName,
          admissionNumber: student.admissionNumber,
        },
        summary,
        fees: studentFees,
        payments: allPayments,
      },
    });
  } catch (error) {
    console.error("Error fetching student fees:", error);
    return NextResponse.json(
      { error: "Failed to fetch fees" },
      { status: 500 }
    );
  }
}
