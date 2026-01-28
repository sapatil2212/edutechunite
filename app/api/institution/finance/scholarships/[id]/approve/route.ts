import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const scholarship = await prisma.feeScholarship.findFirst({
      where: {
        id: params.id,
        schoolId: decoded.schoolId
      },
      include: {
        studentFee: true
      }
    });

    if (!scholarship) {
      return NextResponse.json({ error: 'Scholarship not found' }, { status: 404 });
    }

    if (scholarship.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Only pending scholarships can be approved' 
      }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedScholarship = await tx.feeScholarship.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          approvedBy: decoded.userId,
          approvedAt: new Date()
        }
      });

      const studentFee = scholarship.studentFee;
      const newScholarshipTotal = studentFee.scholarshipAmount + scholarship.scholarshipAmount;
      const newFinalAmount = studentFee.totalAmount - studentFee.discountAmount - newScholarshipTotal + studentFee.taxAmount;
      const newBalanceAmount = newFinalAmount - studentFee.paidAmount;

      await tx.studentFee.update({
        where: { id: scholarship.studentFeeId },
        data: {
          scholarshipAmount: newScholarshipTotal,
          finalAmount: newFinalAmount,
          balanceAmount: newBalanceAmount
        }
      });

      await tx.financeAuditLog.create({
        data: {
          schoolId: decoded.schoolId,
          entityType: 'SCHOLARSHIP',
          entityId: updatedScholarship.id,
          scholarshipId: updatedScholarship.id,
          action: 'APPROVED',
          description: `Scholarship "${scholarship.name}" approved`,
          previousData: scholarship,
          newData: updatedScholarship,
          userId: decoded.userId,
          userName: decoded.fullName || decoded.email,
          userRole: decoded.role
        }
      });

      return updatedScholarship;
    });

    return NextResponse.json({ scholarship: updated });
  } catch (error: any) {
    console.error('Error approving scholarship:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
