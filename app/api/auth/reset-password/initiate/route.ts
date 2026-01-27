import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateOTP } from '@/lib/utils/generate-id'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { admissionNumber, dateOfBirth, email } = await req.json()

    if (!admissionNumber || !dateOfBirth || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find student with matching details
    const student = await prisma.student.findFirst({
      where: {
        admissionNumber,
        dateOfBirth: new Date(dateOfBirth),
        user: {
          email: email.toLowerCase()
        }
      },
      include: {
        user: true
      }
    })

    if (!student || !student.user) {
      return NextResponse.json(
        { error: 'No matching student record found' },
        { status: 404 }
      )
    }

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP
    await (prisma as any).passwordResetOTP.create({
      data: {
        userId: student.user.id,
        otp,
        expiresAt,
      }
    })

    // Send OTP email
    await sendEmail({
      to: email,
      subject: 'Password Reset OTP - EduFlow',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; text-align: center;">
          <h2 style="color: #1e293b;">Password Reset</h2>
          <p style="color: #64748b;">Use the following OTP to reset your password. This code will expire in 10 minutes.</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 5px; color: #0f172a; margin: 24px 0; padding: 12px; background-color: #f8fafc; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `
    })

    return NextResponse.json({ success: true, message: 'OTP sent to your email' })
  } catch (error) {
    console.error('Password reset initiate error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}
