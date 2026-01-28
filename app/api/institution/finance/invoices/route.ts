import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

async function generateInvoiceNumber(schoolId: string): Promise<string> {
  const settings = await prisma.financeSettings.findUnique({
    where: { schoolId }
  });

  if (!settings) {
    const newSettings = await prisma.financeSettings.create({
      data: { schoolId }
    });
    return `${newSettings.invoicePrefix}${String(newSettings.currentInvoiceNumber).padStart(6, '0')}`;
  }

  const invoiceNumber = `${settings.invoicePrefix}${String(settings.currentInvoiceNumber).padStart(6, '0')}`;
  
  await prisma.financeSettings.update({
    where: { schoolId },
    data: { currentInvoiceNumber: settings.currentInvoiceNumber + 1 }
  });

  return invoiceNumber;
}

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

    if (decoded.role === 'STUDENT') {
      where.studentId = decoded.userId;
    } else if (decoded.role === 'PARENT') {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: decoded.userId },
        include: { students: { select: { studentId: true } } }
      });
      if (guardian) {
        where.studentId = { in: guardian.students.map(s => s.studentId) };
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        studentFee: {
          include: {
            student: {
              select: {
                admissionNumber: true,
                fullName: true,
                email: true,
                academicUnit: { select: { name: true } }
              }
            },
            feeStructure: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { invoiceDate: 'desc' }
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
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
      dueDate,
      lineItems,
      notes,
      termsConditions
    } = body;

    if (!studentFeeId || !lineItems || lineItems.length === 0) {
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

    const settings = await prisma.financeSettings.findUnique({
      where: { schoolId: decoded.schoolId }
    });

    const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.amount * (item.quantity || 1)), 0);
    const taxAmount = settings?.enableGST && settings.gstPercentage 
      ? (subtotal * settings.gstPercentage) / 100 
      : 0;
    const totalAmount = subtotal + taxAmount - studentFee.discountAmount;

    const invoiceNumber = await generateInvoiceNumber(decoded.schoolId);

    const invoice = await prisma.invoice.create({
      data: {
        schoolId: decoded.schoolId,
        studentFeeId,
        studentId: studentFee.studentId,
        invoiceNumber,
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        discountAmount: studentFee.discountAmount,
        taxAmount,
        taxPercentage: settings?.gstPercentage,
        taxNumber: settings?.gstNumber,
        totalAmount,
        paidAmount: studentFee.paidAmount,
        balanceAmount: totalAmount - studentFee.paidAmount,
        lineItems,
        notes,
        termsConditions,
        status: studentFee.paidAmount >= totalAmount ? 'PAID' : studentFee.paidAmount > 0 ? 'PARTIALLY_PAID' : 'GENERATED',
        generatedBy: decoded.userId
      },
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
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
