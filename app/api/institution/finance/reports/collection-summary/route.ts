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

    if (decoded.role !== 'SCHOOL_ADMIN' && decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'STAFF') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const academicYearId = searchParams.get('academicYearId');

    const where: any = {
      schoolId: decoded.schoolId,
      status: 'SUCCESS'
    };

    if (fromDate || toDate) {
      where.paidAt = {};
      if (fromDate) where.paidAt.gte = new Date(fromDate);
      if (toDate) where.paidAt.lte = new Date(toDate);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        studentFee: {
          select: {
            academicYearId: true,
            student: {
              select: {
                academicUnit: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    const filteredPayments = academicYearId 
      ? payments.filter(p => p.studentFee.academicYearId === academicYearId)
      : payments;

    const totalCollection = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalLateFee = filteredPayments.reduce((sum, p) => sum + p.lateFeeAmount, 0);

    const byPaymentMethod = filteredPayments.reduce((acc: any, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
      return acc;
    }, {});

    const byDate = filteredPayments.reduce((acc: any, p) => {
      const date = p.paidAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + p.amount;
      return acc;
    }, {});

    const byClass = filteredPayments.reduce((acc: any, p) => {
      const className = p.studentFee.student.academicUnit.name;
      acc[className] = (acc[className] || 0) + p.amount;
      return acc;
    }, {});

    return NextResponse.json({
      summary: {
        totalCollection,
        totalLateFee,
        totalPayments: filteredPayments.length,
        averagePayment: filteredPayments.length > 0 ? totalCollection / filteredPayments.length : 0
      },
      byPaymentMethod,
      byDate,
      byClass,
      period: {
        fromDate: fromDate || filteredPayments[filteredPayments.length - 1]?.paidAt,
        toDate: toDate || filteredPayments[0]?.paidAt
      }
    });
  } catch (error: any) {
    console.error('Error generating collection summary:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
