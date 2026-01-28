import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { calculateFeeBreakdown } from '@/lib/finance/validation';

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
      studentId,
      feeStructureId,
      academicYearId,
      discounts = [],
      scholarships = [],
      customComponents = null,
      dueDate
    } = body;

    if (!studentId || !feeStructureId || !academicYearId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: decoded.schoolId
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const existingAssignment = await prisma.studentFee.findFirst({
      where: {
        studentId,
        feeStructureId
      }
    });

    if (existingAssignment) {
      return NextResponse.json({ error: 'Fee structure already assigned to this student' }, { status: 400 });
    }

    const feeStructure = await prisma.feeStructure.findFirst({
      where: {
        id: feeStructureId,
        schoolId: decoded.schoolId
      },
      include: {
        components: true
      }
    });

    if (!feeStructure) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    const components = customComponents || feeStructure.components;
    const totalAmount = components.reduce((sum: number, comp: any) => sum + comp.amount, 0);

    let discountAmount = 0;
    let scholarshipAmount = 0;

    const breakdown = calculateFeeBreakdown(
      components,
      discountAmount,
      scholarshipAmount,
      0
    );

    const studentFee = await prisma.$transaction(async (tx) => {
      const fee = await tx.studentFee.create({
        data: {
          schoolId: decoded.schoolId,
          studentId,
          feeStructureId,
          academicYearId,
          totalAmount: breakdown.totalAmount,
          discountAmount: breakdown.discountAmount,
          scholarshipAmount: breakdown.scholarshipAmount,
          taxAmount: breakdown.taxAmount,
          finalAmount: breakdown.finalAmount,
          balanceAmount: breakdown.finalAmount,
          assignedBy: decoded.userId || '',
          dueDate: dueDate ? new Date(dueDate) : null,
          isOverridden: customComponents !== null,
          overrideReason: customComponents ? 'Custom fee structure applied during onboarding' : undefined
        }
      });

      for (const discount of discounts) {
        const discValue = discount.discountType === 'PERCENTAGE'
          ? (breakdown.totalAmount * discount.discountValue) / 100
          : discount.discountValue;

        await tx.feeDiscount.create({
          data: {
            schoolId: decoded.schoolId,
            studentFeeId: fee.id,
            studentId,
            name: discount.name,
            description: discount.description,
            discountType: discount.discountType,
            discountValue: discount.discountValue,
            discountAmount: discValue,
            reason: discount.reason,
            approvedBy: decoded.userId || '',
            approvedAt: new Date()
          }
        });

        discountAmount += discValue;
      }

      for (const scholarship of scholarships) {
        const schValue = scholarship.scholarshipType === 'PERCENTAGE'
          ? (breakdown.totalAmount * scholarship.scholarshipValue) / 100
          : scholarship.scholarshipValue;

        await tx.feeScholarship.create({
          data: {
            schoolId: decoded.schoolId,
            studentFeeId: fee.id,
            studentId,
            name: scholarship.name,
            description: scholarship.description,
            scholarshipType: scholarship.scholarshipType,
            scholarshipValue: scholarship.scholarshipValue,
            scholarshipAmount: schValue,
            provider: scholarship.provider,
            validFrom: new Date(),
            status: 'APPROVED',
            approvedBy: decoded.userId || '',
            approvedAt: new Date()
          }
        });

        scholarshipAmount += schValue;
      }

      if (discountAmount > 0 || scholarshipAmount > 0) {
        const updatedBreakdown = calculateFeeBreakdown(
          components,
          discountAmount,
          scholarshipAmount,
          0
        );

        await tx.studentFee.update({
          where: { id: fee.id },
          data: {
            discountAmount,
            scholarshipAmount,
            finalAmount: updatedBreakdown.finalAmount,
            balanceAmount: updatedBreakdown.finalAmount
          }
        });
      }

      const studentFeeCount = await tx.studentFee.count({
        where: { feeStructureId }
      });

      if (!feeStructure.isLocked && studentFeeCount === 1) {
        await tx.feeStructure.update({
          where: { id: feeStructureId },
          data: { isLocked: true }
        });
      }

      await tx.financeAuditLog.create({
        data: {
          schoolId: decoded.schoolId,
          entityType: 'STUDENT_FEE',
          entityId: fee.id,
          action: 'CREATED',
          description: `Fee structure assigned to student ${student.fullName} (${student.admissionNumber})`,
          userId: decoded.userId || '',
          userName: decoded.fullName || decoded.email,
          userRole: decoded.role,
          newData: {
            studentId,
            feeStructureId,
            totalAmount: breakdown.totalAmount,
            finalAmount: breakdown.finalAmount
          }
        }
      });

      return fee;
    });

    const result = await prisma.studentFee.findUnique({
      where: { id: studentFee.id },
      include: {
        feeStructure: {
          include: {
            components: true
          }
        },
        discounts: true,
        scholarships: true
      }
    });

    return NextResponse.json({ studentFee: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error assigning fee structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
