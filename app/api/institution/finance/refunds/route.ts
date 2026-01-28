import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.schoolId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = {
      schoolId: decoded.schoolId,
    };

    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        payment: {
          include: {
            studentFee: {
              include: {
                student: {
                  select: {
                    admissionNumber: true,
                    fullName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ refunds });
  } catch (error: any) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const body = await req.json();
    const {
      paymentId,
      refundAmount,
      refundReason,
      refundType,
      refundMethod,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      documents,
      remarks
    } = body;

    if (!paymentId || !refundAmount || !refundReason || !refundType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        schoolId: decoded.schoolId
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (refundAmount > payment.amount) {
      return NextResponse.json({ 
        error: 'Refund amount cannot exceed payment amount' 
      }, { status: 400 });
    }

    const existingRefunds = await prisma.refund.findMany({
      where: {
        paymentId,
        status: { in: ['APPROVED', 'PROCESSED', 'COMPLETED'] }
      }
    });

    const totalRefunded = existingRefunds.reduce((sum, r) => sum + r.refundAmount, 0);
    if (totalRefunded + refundAmount > payment.amount) {
      return NextResponse.json({ 
        error: 'Total refund amount exceeds payment amount' 
      }, { status: 400 });
    }

    const refund = await prisma.$transaction(async (tx) => {
      const newRefund = await tx.refund.create({
        data: {
          schoolId: decoded.schoolId,
          paymentId,
          studentId: payment.studentId,
          refundAmount,
          refundReason,
          refundType,
          refundMethod,
          accountHolderName,
          accountNumber,
          ifscCode,
          bankName,
          documents,
          remarks,
          status: 'INITIATED',
          initiatedBy: decoded.userId
        }
      });

      await tx.financeAuditLog.create({
        data: {
          schoolId: decoded.schoolId,
          entityType: 'REFUND',
          entityId: newRefund.id,
          refundId: newRefund.id,
          action: 'CREATED',
          description: `Refund of ₹${refundAmount} initiated for payment ${payment.receiptNumber}`,
          newData: newRefund,
          userId: decoded.userId,
          userName: decoded.fullName || decoded.email,
          userRole: decoded.role
        }
      });

      return newRefund;
    });

    return NextResponse.json({ refund }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating refund:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
