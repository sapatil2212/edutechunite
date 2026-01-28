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

    const refund = await prisma.refund.findFirst({
      where: {
        id: params.id,
        schoolId: decoded.schoolId
      }
    });

    if (!refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    if (refund.status !== 'INITIATED' && refund.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ 
        error: 'Only initiated or pending refunds can be approved' 
      }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRefund = await tx.refund.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          approvedBy: decoded.userId,
          approvedAt: new Date()
        }
      });

      await tx.financeAuditLog.create({
        data: {
          schoolId: decoded.schoolId,
          entityType: 'REFUND',
          entityId: updatedRefund.id,
          refundId: updatedRefund.id,
          action: 'APPROVED',
          description: `Refund of ₹${refund.refundAmount} approved`,
          previousData: refund,
          newData: updatedRefund,
          userId: decoded.userId,
          userName: decoded.fullName || decoded.email,
          userRole: decoded.role
        }
      });

      return updatedRefund;
    });

    return NextResponse.json({ refund: updated });
  } catch (error: any) {
    console.error('Error approving refund:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
