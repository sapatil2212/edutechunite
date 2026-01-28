import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { validatePayment, generateReceiptNumber } from '@/lib/finance/validation';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.schoolId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'SCHOOL_ADMIN' && decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'STAFF') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

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
      remarks,
      allocationDetails
    } = body;

    if (!studentFeeId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const studentFee = await prisma.studentFee.findFirst({
      where: {
        id: studentFeeId,
        schoolId: decoded.schoolId
      },
      include: {
        student: true,
        feeStructure: {
          include: {
            academicYear: true,
            academicUnit: true,
            components: true
          }
        }
      }
    });

    if (!studentFee) {
      return NextResponse.json({ error: 'Student fee record not found' }, { status: 404 });
    }

    validatePayment(
      { amount, paymentMethod, transactionId, referenceNumber, bankName, branchName, remarks },
      studentFee.balanceAmount
    );

    const financeSettings = await prisma.financeSettings.findUnique({
      where: { schoolId: decoded.schoolId }
    });

    let receiptNumber: string;
    if (financeSettings) {
      receiptNumber = generateReceiptNumber(
        financeSettings.receiptPrefix,
        financeSettings.currentReceiptNumber
      );
    } else {
      receiptNumber = generateReceiptNumber('RCP', 1);
    }

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          schoolId: decoded.schoolId,
          studentFeeId,
          studentId: studentFee.studentId,
          amount,
          paymentMethod,
          transactionId: transactionId || undefined,
          transactionDate: transactionDate ? new Date(transactionDate) : undefined,
          referenceNumber: referenceNumber || undefined,
          bankName: bankName || undefined,
          branchName: branchName || undefined,
          receiptNumber,
          allocationDetails: allocationDetails || undefined,
          paidAt: new Date(),
          recordedBy: decoded.userId || '',
          remarks: remarks || undefined,
          status: 'SUCCESS'
        }
      });

      const newPaidAmount = studentFee.paidAmount + amount;
      const newBalanceAmount = studentFee.finalAmount - newPaidAmount;
      
      let newStatus = studentFee.status;
      if (newBalanceAmount <= 0) {
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

      if (financeSettings) {
        await tx.financeSettings.update({
          where: { schoolId: decoded.schoolId },
          data: {
            currentReceiptNumber: financeSettings.currentReceiptNumber + 1
          }
        });
      } else {
        await tx.financeSettings.create({
          data: {
            schoolId: decoded.schoolId,
            currentReceiptNumber: 2
          }
        });
      }

      await tx.financeAuditLog.create({
        data: {
          schoolId: decoded.schoolId,
          entityType: 'PAYMENT',
          entityId: newPayment.id,
          paymentId: newPayment.id,
          action: 'CREATED',
          description: `Payment of ₹${amount} collected from ${studentFee.student.fullName} (${studentFee.student.admissionNumber}) via ${paymentMethod}`,
          userId: decoded.userId || '',
          userName: decoded.fullName || decoded.email,
          userRole: decoded.role,
          newData: {
            amount,
            paymentMethod,
            receiptNumber,
            studentId: studentFee.studentId
          }
        }
      });

      return newPayment;
    });

    const result = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: {
        studentFee: {
          include: {
            student: true,
            feeStructure: {
              include: {
                academicYear: true,
                academicUnit: true,
                components: true
              }
            },
            discounts: true,
            scholarships: true
          }
        }
      }
    });

    return NextResponse.json({ payment: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error collecting payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
