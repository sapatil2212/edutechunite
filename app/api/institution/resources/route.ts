import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Get resources/study materials
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const academicUnitId = searchParams.get('academicUnitId')
    const subjectId = searchParams.get('subjectId')
    const resourceType = searchParams.get('resourceType')
    const chapter = searchParams.get('chapter')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      schoolId: session.user.schoolId,
      isActive: true,
    }

    // For students, filter by their class
    if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { academicUnitId: true, academicYearId: true },
      })
      if (!student) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }
      where.OR = [
        { isPublic: true },
        { academicUnitId: student.academicUnitId },
      ]
    } else if (session.user.role === 'PARENT') {
      // Get linked students' classes
      const linkedStudents = await prisma.studentGuardian.findMany({
        where: {
          guardian: { userId: session.user.id },
        },
        include: {
          student: {
            select: { academicUnitId: true },
          },
        },
      })
      const unitIds = [...new Set(linkedStudents.map(s => s.student.academicUnitId))]
      where.OR = [
        { isPublic: true },
        { academicUnitId: { in: unitIds } },
      ]
    }

    if (academicUnitId) {
      where.academicUnitId = academicUnitId
    }

    if (subjectId) {
      where.subjectId = subjectId
    }

    if (resourceType) {
      where.resourceType = resourceType
    }

    if (chapter) {
      where.chapter = chapter
    }

    const total = await prisma.resource.count({ where })

    const resources = await prisma.resource.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        academicUnit: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    })

    return NextResponse.json({
      resources,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

// POST: Upload resource (for teachers/admins)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      description,
      resourceType,
      fileUrl,
      thumbnailUrl,
      fileSize,
      mimeType,
      academicYearId,
      academicUnitId,
      subjectId,
      chapter,
      tags,
      isPublic,
      allowDownload,
      displayOrder,
    } = body

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const resource = await prisma.resource.create({
      data: {
        schoolId: session.user.schoolId,
        title,
        description,
        resourceType: resourceType || 'PDF',
        fileUrl,
        thumbnailUrl,
        fileSize,
        mimeType,
        academicYearId,
        academicUnitId,
        subjectId,
        chapter,
        tags,
        isPublic: isPublic ?? false,
        allowDownload: allowDownload ?? true,
        displayOrder: displayOrder ?? 0,
        uploadedBy: session.user.id,
      },
      include: {
        subject: true,
        academicUnit: true,
      },
    })

    return NextResponse.json({ resource }, { status: 201 })
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    )
  }
}
