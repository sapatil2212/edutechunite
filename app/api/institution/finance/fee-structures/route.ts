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
    const academicYearId = searchParams.get('academicYearId');
    const academicUnitId = searchParams.get('academicUnitId');
    const isActive = searchParams.get('isActive');

    const where: any = {
      schoolId: user.schoolId,
    };

    if (academicYearId) where.academicYearId = academicYearId;
    if (isActive !== null) where.isActive = isActive === 'true';

    // Handle academicUnitId - check both the unit itself and its parent (for class-level fee structures)
    if (academicUnitId) {
      // First, get the academic unit to check if it has a parent
      const academicUnit = await prisma.academicUnit.findUnique({
        where: { id: academicUnitId },
        select: { id: true, parentId: true }
      });

      if (academicUnit) {
        // Build OR conditions for fee structure lookup
        const orConditions: any[] = [
          { academicUnitId: academicUnitId }
        ];
        
        // If this unit has a parent (it's a section), also check the parent class
        if (academicUnit.parentId) {
          orConditions.push({ academicUnitId: academicUnit.parentId });
        }
        
        // Also check for fee structures that apply to all classes (null academicUnitId)
        orConditions.push({ academicUnitId: null });
        
        where.OR = orConditions;
      } else {
        // Unit not found, just search by the provided ID
        where.OR = [
          { academicUnitId: academicUnitId },
          { academicUnitId: null }
        ];
      }
    }

    const feeStructures = await prisma.feeStructure.findMany({
      where,
      include: {
        academicYear: {
          select: { name: true, startDate: true, endDate: true }
        },
        academicUnit: {
          select: { name: true, type: true }
        },
        components: {
          include: {
            installments: true
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { studentFees: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ feeStructures });
  } catch (error: any) {
    console.error('Error fetching fee structures:', error);
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
      name,
      description,
      academicYearId,
      courseId,
      academicUnitId,
      components
    } = body;

    if (!name || !academicYearId || !components || components.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        schoolId: user.schoolId,
        name,
        description,
        academicYearId,
        courseId,
        academicUnitId,
        createdBy: session.user.id,
        components: {
          create: components.map((comp: any, index: number) => ({
            name: comp.name,
            feeType: comp.feeType,
            description: comp.description,
            amount: comp.amount,
            frequency: comp.frequency,
            isMandatory: comp.isMandatory ?? true,
            dueDate: comp.dueDate ? new Date(comp.dueDate) : null,
            allowPartialPayment: comp.allowPartialPayment ?? true,
            lateFeeApplicable: comp.lateFeeApplicable ?? false,
            lateFeeAmount: comp.lateFeeAmount,
            lateFeePercentage: comp.lateFeePercentage,
            displayOrder: index,
            installments: comp.installments ? {
              create: comp.installments.map((inst: any) => ({
                installmentNumber: inst.installmentNumber,
                name: inst.name,
                amount: inst.amount,
                dueDate: new Date(inst.dueDate)
              }))
            } : undefined
          }))
        }
      },
      include: {
        components: {
          include: { installments: true }
        }
      }
    });

    return NextResponse.json(
      { success: true, message: 'Fee structure created successfully', feeStructure },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating fee structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
