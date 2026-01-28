import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const academicYearId = searchParams.get('academicYearId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      schoolId: user.schoolId,
    };

    if (studentId) where.studentId = studentId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (status) where.status = status;

    if (user.role === 'STUDENT') {
      where.studentId = session.user.id;
    } else if (user.role === 'PARENT') {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: session.user.id },
        include: { students: { select: { studentId: true } } }
      });
      if (guardian) {
        where.studentId = { in: guardian.students.map(s => s.studentId) };
      }
    }

    const [studentFees, total] = await Promise.all([
      prisma.studentFee.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              admissionNumber: true,
              fullName: true,
              academicUnit: { select: { name: true } }
            }
          },
          feeStructure: {
            select: {
              id: true,
              name: true,
              description: true,
              academicYear: { select: { name: true } },
              components: {
                select: {
                  id: true,
                  name: true,
                  feeType: true,
                  amount: true,
                  frequency: true,
                  isMandatory: true
                },
                orderBy: { displayOrder: 'asc' }
              }
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              transactionId: true,
              receiptNumber: true,
              paidAt: true,
              remarks: true,
              status: true
            },
            orderBy: { paidAt: 'desc' }
          },
          discounts: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              discountType: true,
              discountValue: true,
              discountAmount: true,
              reason: true
            }
          },
          scholarships: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              name: true,
              scholarshipAmount: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.studentFee.count({ where })
    ]);

    return NextResponse.json({
      studentFees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching student fees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      studentId,
      feeStructureId,
      academicYearId,
      totalAmount,
      dueDate,
      isCustomPlan,
      customPlanDetails
    } = body;

    if (!studentId || !feeStructureId || !academicYearId || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.studentFee.findFirst({
      where: {
        studentId,
        feeStructureId,
        schoolId: user.schoolId
      }
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'Fee already assigned to this student' 
      }, { status: 400 });
    }

    const studentFee = await prisma.studentFee.create({
      data: {
        schoolId: user.schoolId,
        studentId,
        feeStructureId,
        academicYearId,
        totalAmount,
        finalAmount: totalAmount,
        balanceAmount: totalAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        isCustomPlan,
        customPlanDetails,
        assignedBy: session.user.id
      },
      include: {
        student: {
          select: {
            admissionNumber: true,
            fullName: true
          }
        },
        feeStructure: {
          include: {
            components: true
          }
        }
      }
    });

    await prisma.feeStructure.update({
      where: { id: feeStructureId },
      data: { isLocked: true }
    });

    return NextResponse.json({ studentFee }, { status: 201 });
  } catch (error: any) {
    console.error('Error assigning student fee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
