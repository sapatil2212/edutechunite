import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail, getWelcomeEmailTemplate } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/error?error=missing-token', request.url))
    }
    
    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
      include: { school: true },
    })
    
    if (!user) {
      return NextResponse.redirect(new URL('/auth/error?error=invalid-token', request.url))
    }
    
    // Check if token has expired
    if (user.verificationExpiry && new Date() > user.verificationExpiry) {
      return NextResponse.redirect(new URL('/auth/error?error=token-expired', request.url))
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(new URL('/auth/login?verified=already', request.url))
    }
    
    // Update user as verified
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          verificationToken: null,
          verificationExpiry: null,
          status: 'ACTIVE',
        },
      })
      
      // Also update school status if this is the admin
      if (user.school && user.role === 'SCHOOL_ADMIN') {
        await tx.school.update({
          where: { id: user.school.id },
          data: {
            status: 'ACTIVE',
            isVerified: true,
            verifiedAt: new Date(),
          },
        })
      }
    })
    
    // Send welcome email
    if (user.school) {
      const emailHtml = getWelcomeEmailTemplate(
        user.fullName,
        user.school.name,
        user.school.schoolId
      )
      
      await sendEmail({
        to: user.email,
        subject: `Welcome to EduFlow - ${user.school.name}`,
        html: emailHtml,
      })
    }
    
    // Redirect to login with success message
    return NextResponse.redirect(new URL('/auth/login?verified=success', request.url))
    
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(new URL('/auth/error?error=server-error', request.url))
  }
}

