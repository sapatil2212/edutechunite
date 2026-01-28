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
    const isActive = searchParams.get('isActive');

    const where: any = {
      schoolId: decoded.schoolId,
    };

    if (studentId) where.studentId = studentId;
    if (isActive !== null) where.isActive = isActive === 'true';

    const discounts = await prisma.feeDiscount.findMany({
      where,
      include: {
        studentFee: {
          include: {
            student: {
              select: {
                admissionNumber: true,
                fullName: true,
                academicUnit: { select: { name: true } }
              }
            },
            feeStructure: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ discounts });
  } catch (error: any) {
    console.error('Error fetching discounts:', error);
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

    if (decoded.role !== 'SCHOOL_ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentFeeId,
      name,
      description,
      discountType,
      discountValue,
      applicableComponents,
      isRecurring,
      recurringMonths,
      reason
    } = body;

    if (!studentFeeId || !name || !discountType || !discountValue || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const studentFee = await prisma.studentFee.findFirst({
      where: {
        id: studentFeeId,
        schoolId: decoded.schoolId
      }
    });

    if (!studentFee) {
      return NextResponse.json({ error: 'Student fee not found' }, { status: 404 });
    }

    let discountAmount = 0;
    if (discountType === 'PERCENTAGE') {
      discountAmount = (studentFee.totalAmount * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    const discount = await prisma.$transaction(async (tx) => {
      const newDiscount = await tx.feeDiscount.create({
        data: {
          schoolId: decoded.schoolId,
          studentFeeId,
          studentId: studentFee.studentId,
          name,
          description,
          discountType,
          discountValue,
          discountAmount,
          applicableComponents,
          isRecurring,
          recurringMonths,
          reason,
          approvedBy: decoded.userId,
          approvedAt: new Date()
        }
      });

      const newDiscountTotal = studentFee.discountAmount + discountAmount;
      const newFinalAmount = studentFee.totalAmount - newDiscountTotal - studentFee.scholarshipAmount + studentFee.taxAmount;
      const newBalanceAmount = newFinalAmount - studentFee.paidAmount;

      await tx.studentFee.update({
        where: { id: studentFeeId },
        data: {
          discountAmount: newDiscountTotal,
          finalAmount: newFinalAmount,
          balanceAmount: newBalanceAmount
        }
      });

      await tx.financeAuditLog.create({
        data: {
          schoolId: decoded.schoolId,
          entityType: 'DISCOUNT',
          entityId: newDiscount.id,
          discountId: newDiscount.id,
          action: 'CREATED',
          description: `Discount "${name}" of ₹${discountAmount} applied`,
          newData: newDiscount,
          userId: decoded.userId,
          userName: decoded.fullName || decoded.email,
          userRole: decoded.role
        }
      });

      return newDiscount;
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating discount:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
