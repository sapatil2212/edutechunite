import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { extractTimetableFromText, extractTimetableFromFile } from '@/lib/ai/gemini'

// POST - Extract timetable from text or file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true, role: true },
    })

    if (!user?.schoolId) {
      return NextResponse.json(
        { success: false, message: 'No institution associated' },
        { status: 404 }
      )
    }

    if (user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const contentType = request.headers.get('content-type') || ''

    let extractedTemplate = null

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const textContent = formData.get('textContent') as string | null

      if (textContent) {
        // Extract from pasted text
        extractedTemplate = await extractTimetableFromText(textContent)
      } else if (file) {
        // Extract from file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')

        // Determine MIME type
        const mimeType = file.type || 'application/octet-stream'
        const fileName = file.name

        // Check supported types
        const supportedTypes = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/webp',
          'text/plain',
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ]

        if (!supportedTypes.some((t) => mimeType.includes(t.split('/')[1]))) {
          return NextResponse.json(
            { success: false, message: `Unsupported file type: ${mimeType}. Please use PDF, images, Word, Excel, or text files.` },
            { status: 400 }
          )
        }

        extractedTemplate = await extractTimetableFromFile(base64, mimeType, fileName)
      } else {
        return NextResponse.json(
          { success: false, message: 'No file or text content provided' },
          { status: 400 }
        )
      }
    } else {
      // Handle JSON body with text content
      const body = await request.json()
      const { textContent } = body

      if (!textContent) {
        return NextResponse.json(
          { success: false, message: 'Text content is required' },
          { status: 400 }
        )
      }

      extractedTemplate = await extractTimetableFromText(textContent)
    }

    if (!extractedTemplate) {
      return NextResponse.json(
        { success: false, message: 'Could not extract timetable information. Please check the content format and ensure your API key is valid.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Timetable extracted successfully',
      data: extractedTemplate,
    })
  } catch (error) {
    console.error('AI extraction error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to extract timetable. Please check your API key and content format.',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

