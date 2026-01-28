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
    const status = searchParams.get('status');

    const where: any = {
      schoolId: decoded.schoolId,
    };

    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const scholarships = await prisma.feeScholarship.findMany({
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

    return NextResponse.json({ scholarships });
  } catch (error: any) {
    console.error('Error fetching scholarships:', error);
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

    const body = await req.json();
    const {
      studentFeeId,
      name,
      description,
      scholarshipType,
      scholarshipValue,
      provider,
      referenceNumber,
      validFrom,
      validTo,
      applicableComponents,
      documents
    } = body;

    if (!studentFeeId || !name || !scholarshipType || !scholarshipValue || !validFrom) {
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

    let scholarshipAmount = 0;
    if (scholarshipType === 'PERCENTAGE') {
      scholarshipAmount = (studentFee.totalAmount * scholarshipValue) / 100;
    } else {
      scholarshipAmount = scholarshipValue;
    }

    const scholarship = await prisma.feeScholarship.create({
      data: {
        schoolId: decoded.schoolId,
        studentFeeId,
        studentId: studentFee.studentId,
        name,
        description,
        scholarshipType,
        scholarshipValue,
        scholarshipAmount,
        provider,
        referenceNumber,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : null,
        applicableComponents,
        documents,
        status: 'PENDING',
        appliedBy: decoded.userId
      }
    });

    await prisma.financeAuditLog.create({
      data: {
        schoolId: decoded.schoolId,
        entityType: 'SCHOLARSHIP',
        entityId: scholarship.id,
        scholarshipId: scholarship.id,
        action: 'CREATED',
        description: `Scholarship "${name}" of ₹${scholarshipAmount} applied`,
        newData: scholarship,
        userId: decoded.userId,
        userName: decoded.fullName || decoded.email,
        userRole: decoded.role
      }
    });

    return NextResponse.json({ scholarship }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating scholarship:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
