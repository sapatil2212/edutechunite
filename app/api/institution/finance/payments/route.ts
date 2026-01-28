import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function generateReceiptNumber(schoolId: string): Promise<string> {
  const settings = await prisma.financeSettings.findUnique({
    where: { schoolId }
  });

  if (!settings) {
    const newSettings = await prisma.financeSettings.create({
      data: { schoolId }
    });
    return `${newSettings.receiptPrefix}${String(newSettings.currentReceiptNumber).padStart(6, '0')}`;
  }

  const receiptNumber = `${settings.receiptPrefix}${String(settings.currentReceiptNumber).padStart(6, '0')}`;
  
  await prisma.financeSettings.update({
    where: { schoolId },
    data: { currentReceiptNumber: settings.currentReceiptNumber + 1 }
  });

  return receiptNumber;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = session.user.schoolId;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      studentFee: {
        schoolId,
      },
    };

    if (studentId) where.studentFee.studentId = studentId;
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    
    if (fromDate || toDate) {
      where.paidAt = {};
      if (fromDate) where.paidAt.gte = new Date(fromDate);
      if (toDate) where.paidAt.lte = new Date(toDate);
    }

    if (session.user.role === 'STUDENT') {
      where.studentFee.studentId = session.user.id;
    } else if (session.user.role === 'PARENT') {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: session.user.id },
        include: { students: { select: { studentId: true } } }
      });
      if (guardian) {
        where.studentFee.studentId = { in: guardian.students.map(s => s.studentId) };
      }
    }

    const [paymentsData, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          studentFee: {
            select: {
              finalAmount: true,
              balanceAmount: true,
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { paidAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    // Fetch student details separately for each payment
    const payments = await Promise.all(
      paymentsData.map(async (payment) => {
        const student = await prisma.student.findUnique({
          where: { id: payment.studentId },
          select: {
            fullName: true,
            admissionNumber: true,
            academicUnit: { select: { name: true } }
          }
        });

        return {
          ...payment,
          student: student || { fullName: 'Unknown', admissionNumber: 'N/A', academicUnit: { name: 'N/A' } }
        };
      })
    );

    return NextResponse.json({
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = session.user.schoolId;

    const body = await req.json();
    const {
      studentFeeId,
      amount,
      paymentMethod,
      transactionId,
      transactionDate,
      referenceNumber,
      bankName,
      branchName,
      allocationDetails,
      lateFeeAmount,
      remarks
    } = body;

    if (!studentFeeId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const studentFee = await prisma.studentFee.findFirst({
      where: {
        id: studentFeeId,
        schoolId
      }
    });

    if (!studentFee) {
      return NextResponse.json({ error: 'Student fee not found' }, { status: 404 });
    }

    if (amount > studentFee.balanceAmount) {
      return NextResponse.json({ 
        error: 'Payment amount exceeds balance amount' 
      }, { status: 400 });
    }

    const receiptNumber = await generateReceiptNumber(schoolId);

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          schoolId,
          studentFeeId,
          studentId: studentFee.studentId,
          amount,
          paymentMethod,
          transactionId,
          transactionDate: transactionDate ? new Date(transactionDate) : null,
          referenceNumber,
          bankName,
          branchName,
          receiptNumber,
          allocationDetails,
          lateFeeAmount: lateFeeAmount || 0,
          remarks,
          recordedBy: session.user.id,
          status: 'SUCCESS'
        }
      });

      const newPaidAmount = studentFee.paidAmount + amount;
      const newBalanceAmount = studentFee.finalAmount - newPaidAmount;
      
      let newStatus = studentFee.status;
      if (newBalanceAmount === 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL';
      }

      await tx.studentFee.update({
        where: { id: studentFeeId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus
        }
      });

      await tx.financeAuditLog.create({
        data: {
          schoolId,
          entityType: 'PAYMENT',
          entityId: newPayment.id,
          paymentId: newPayment.id,
          action: 'CREATED',
          description: `Payment of ₹${amount} recorded via ${paymentMethod}`,
          newData: newPayment,
          userId: session.user.id,
          userName: session.user.name || session.user.email || 'Admin',
          userRole: session.user.role
        }
      });

      return newPayment;
    });

    const paymentWithDetails = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: {
        studentFee: {
          include: {
            student: {
              select: {
                admissionNumber: true,
                fullName: true,
                email: true
              }
            },
            feeStructure: {
              select: { name: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ payment: paymentWithDetails }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
