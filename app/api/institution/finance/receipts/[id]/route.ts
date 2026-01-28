import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true, role: true },
    });

    if (!user?.schoolId) {
      return NextResponse.json(
        { success: false, error: 'No institution associated' },
        { status: 404 }
      );
    }

    // Find the payment by receipt number (params.id is the receipt number)
    const payment = await prisma.payment.findFirst({
      where: {
        receiptNumber: params.id,
        schoolId: user.schoolId,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Fetch student details
    const student = await prisma.student.findUnique({
      where: { id: payment.studentId },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        academicUnit: {
          select: {
            name: true,
            parent: {
              select: { name: true }
            }
          }
        },
        academicYear: {
          select: { name: true }
        }
      }
    });

    // Fetch student fee details
    const studentFee = await prisma.studentFee.findUnique({
      where: { id: payment.studentFeeId },
      select: {
        totalAmount: true,
        discountAmount: true,
        finalAmount: true,
        paidAmount: true,
        balanceAmount: true,
        feeStructure: {
          select: {
            name: true,
            components: {
              select: {
                name: true,
                feeType: true,
                amount: true,
                frequency: true
              },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    // Get school details
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: {
        name: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        phone: true,
        email: true,
        logo: true
      }
    });

    // Get the user who collected the payment
    let collectedByName = 'Admin';
    if (payment.recordedBy) {
      const collector = await prisma.user.findUnique({
        where: { id: payment.recordedBy },
        select: { fullName: true }
      });
      if (collector) {
        collectedByName = collector.fullName;
      }
    }

    const receipt = {
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paidAt?.toISOString() || payment.createdAt.toISOString(),
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      amount: payment.amount,
      student: student,
      studentFee: studentFee,
      school: school || {
        name: 'Institution',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        logo: null
      },
      collectedBy: collectedByName
    };

    return NextResponse.json({ receipt });
  } catch (error: any) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
