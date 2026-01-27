import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/utils/password'
import { sendEmail, getPasswordResetNotificationTemplate } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { admissionNumber, otp, newPassword } = await req.json()

    if (!admissionNumber || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find valid OTP
    const validOTP = await (prisma as any).passwordResetOTP.findFirst({
      where: {
        otp,
        isUsed: false,
        expiresAt: { gt: new Date() },
        user: {
          username: admissionNumber
        }
      },
      include: {
        user: {
          include: {
            school: true,
            studentProfile: true,
            guardianProfile: {
              include: {
                students: {
                  include: {
                    guardian: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!validOTP) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(newPassword)

    // Update password and mark OTP as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: validOTP.userId },
        data: { 
          password: hashedPassword,
          mustChangePassword: false
        } as any
      }),
      (prisma as any).passwordResetOTP.update({
        where: { id: validOTP.id },
        data: { isUsed: true }
      })
    ])

    // Send notifications
    const school = validOTP.user.school
    const studentName = validOTP.user.fullName
    
    // Get all relevant emails
    const emailsToSend: string[] = [validOTP.user.email]
    
    if (school) {
      // Add school admin email
      const admins = await prisma.user.findMany({
        where: {
          schoolId: school.id,
          role: 'SCHOOL_ADMIN'
        },
        select: { email: true }
      })
      admins.forEach(a => emailsToSend.push(a.email))
      
      // Add super admin email (system default or actual super admins)
      const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: { email: true }
      })
      superAdmins.forEach(sa => emailsToSend.push(sa.email))
    }

    // Add parents emails
    const studentProfile = await prisma.student.findFirst({
        where: { userId: validOTP.userId },
        include: { guardians: { include: { guardian: true } } }
    })
    studentProfile?.guardians.forEach(g => {
        if (g.guardian.email) emailsToSend.push(g.guardian.email)
    })

    // Send emails (unique recipients only)
    const uniqueEmails = Array.from(new Set(emailsToSend.filter(Boolean)))
    
    const notificationHtml = getPasswordResetNotificationTemplate(studentName, school?.name || 'EduFlow')
    
    await Promise.all(
        uniqueEmails.map(email => 
            sendEmail({
                to: email,
                subject: `Password Reset Successful - ${studentName}`,
                html: notificationHtml
            })
        )
    )

    return NextResponse.json({ success: true, message: 'Password reset successful' })
  } catch (error) {
    console.error('Password reset verify error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}
