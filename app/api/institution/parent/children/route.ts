import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the guardian record for this user
    const guardian = await prisma.guardian.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            student: {
              include: {
                academicUnit: {
                  select: { name: true }
                },
                academicYear: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    })

    if (!guardian) {
      return NextResponse.json({ children: [] })
    }

    const children = guardian.students.map(gs => ({
      id: gs.student.id,
      fullName: gs.student.fullName,
      admissionNumber: gs.student.admissionNumber,
      academicUnit: gs.student.academicUnit,
      academicYear: gs.student.academicYear,
      profilePhoto: gs.student.profilePhoto,
    }))

    return NextResponse.json({ children })
  } catch (error) {
    console.error('Error fetching children:', error)
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    )
  }
}
