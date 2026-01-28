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

    let settings = await prisma.financeSettings.findUnique({
      where: { schoolId: decoded.schoolId }
    });

    if (!settings) {
      settings = await prisma.financeSettings.create({
        data: { schoolId: decoded.schoolId }
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error fetching finance settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const settings = await prisma.financeSettings.upsert({
      where: { schoolId: decoded.schoolId },
      update: body,
      create: {
        schoolId: decoded.schoolId,
        ...body
      }
    });

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error updating finance settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
