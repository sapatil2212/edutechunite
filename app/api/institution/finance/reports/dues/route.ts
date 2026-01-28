import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = session.user.schoolId;

    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get('academicYearId');
    const academicUnitId = searchParams.get('academicUnitId');
    const overdueOnly = searchParams.get('overdueOnly') === 'true';

    const where: any = {
      schoolId,
      status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      balanceAmount: { gt: 0 }
    };

    if (academicYearId) where.academicYearId = academicYearId;

    const studentFees = await prisma.studentFee.findMany({
      where,
      include: {
        student: {
          select: {
            admissionNumber: true,
            fullName: true,
            email: true,
            phone: true,
            academicUnit: {
              select: { name: true, id: true }
            }
          }
        },
        feeStructure: {
          select: {
            name: true,
            academicYear: { select: { name: true } }
          }
        }
      }
    });

    let filteredFees = studentFees;
    if (academicUnitId) {
      filteredFees = studentFees.filter(f => f.student.academicUnit.id === academicUnitId);
    }

    if (overdueOnly) {
      const today = new Date();
      filteredFees = filteredFees.filter(f => f.dueDate && f.dueDate < today);
    }

    const totalDues = filteredFees.reduce((sum, f) => sum + f.balanceAmount, 0);
    const totalStudents = filteredFees.length;

    const byClass = filteredFees.reduce((acc: any, f) => {
      const className = f.student.academicUnit.name;
      if (!acc[className]) {
        acc[className] = {
          totalDues: 0,
          studentCount: 0,
          students: []
        };
      }
      acc[className].totalDues += f.balanceAmount;
      acc[className].studentCount += 1;
      acc[className].students.push({
        admissionNumber: f.student.admissionNumber,
        fullName: f.student.fullName,
        balanceAmount: f.balanceAmount,
        dueDate: f.dueDate
      });
      return acc;
    }, {});

    const overdueCount = filteredFees.filter(f => {
      const today = new Date();
      return f.dueDate && f.dueDate < today;
    }).length;

    return NextResponse.json({
      summary: {
        totalDues,
        totalStudents,
        overdueCount,
        averageDue: totalStudents > 0 ? totalDues / totalStudents : 0
      },
      byClass,
      details: filteredFees.map(f => ({
        studentFeeId: f.id,
        admissionNumber: f.student.admissionNumber,
        studentName: f.student.fullName,
        class: f.student.academicUnit.name,
        feeStructure: f.feeStructure.name,
        totalAmount: f.finalAmount,
        paidAmount: f.paidAmount,
        balanceAmount: f.balanceAmount,
        dueDate: f.dueDate,
        isOverdue: f.dueDate ? f.dueDate < new Date() : false,
        status: f.status
      }))
    });
  } catch (error: any) {
    console.error('Error generating dues report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
