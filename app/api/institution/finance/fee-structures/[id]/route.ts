import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const feeStructure = await prisma.feeStructure.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId
      },
      include: {
        academicYear: true,
        academicUnit: true,
        components: {
          include: { installments: true },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { studentFees: true }
        }
      }
    });

    if (!feeStructure) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    return NextResponse.json({ feeStructure });
  } catch (error: any) {
    console.error('Error fetching fee structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existing = await prisma.feeStructure.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId
      },
      include: {
        _count: { select: { studentFees: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    if (existing.isLocked) {
      return NextResponse.json({ 
        error: 'Cannot modify locked fee structure. Students are already assigned.' 
      }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, isActive, academicUnitId, components } = body;

    // Use transaction to update fee structure and components
    const feeStructure = await prisma.$transaction(async (tx) => {
      // If components are provided, delete existing ones and create new ones
      if (components && Array.isArray(components)) {
        // Delete existing components
        await tx.feeComponent.deleteMany({
          where: { feeStructureId: params.id }
        });

        // Update fee structure with new components
        return await tx.feeStructure.update({
          where: { id: params.id },
          data: {
            name,
            description,
            isActive,
            academicUnitId: academicUnitId || null,
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
              }))
            }
          },
          include: {
            components: {
              include: { installments: true },
              orderBy: { displayOrder: 'asc' }
            }
          }
        });
      } else {
        // Just update basic fields
        return await tx.feeStructure.update({
          where: { id: params.id },
          data: {
            name,
            description,
            isActive,
            academicUnitId: academicUnitId !== undefined ? academicUnitId || null : undefined,
          },
          include: {
            components: {
              include: { installments: true },
              orderBy: { displayOrder: 'asc' }
            }
          }
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Fee structure updated successfully', 
      feeStructure 
    });
  } catch (error: any) {
    console.error('Error updating fee structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existing = await prisma.feeStructure.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId
      },
      include: {
        _count: { select: { studentFees: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    if (existing._count.studentFees > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete fee structure with assigned students. Deactivate it instead.' 
      }, { status: 400 });
    }

    await prisma.feeStructure.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Fee structure deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting fee structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
