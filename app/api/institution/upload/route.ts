import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getJWTUser } from '@/lib/jwt'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'students'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'application/zip'
    ]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: Images, PDF, Word, Excel, Text, Zip' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760')
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.` },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder: `edugrow/${user.schoolId}/${folder}`,
      resource_type: 'auto',
      // transformation: [
      //   { width: 500, height: 500, crop: 'limit' },
      //   { quality: 'auto' },
      //   { fetch_format: 'auto' },
      // ],
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// DELETE: Remove an uploaded file
export async function DELETE(req: NextRequest) {
  try {
    // Try NextAuth session first, then JWT
    const session = await getServerSession(authOptions)
    const jwtUser = await getJWTUser(req)
    
    const user = session?.user || jwtUser
    
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return NextResponse.json({ error: 'No publicId provided' }, { status: 400 })
    }

    // Ensure user can only delete files from their school
    if (!publicId.includes(user.schoolId!)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await cloudinary.uploader.destroy(publicId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
