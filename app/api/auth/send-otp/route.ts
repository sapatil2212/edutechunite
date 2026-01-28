import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOTP } from '@/lib/utils/generate-id';
import { sendEmail, getOTPEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { school: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Email already verified' },
        { status: 400 }
      );
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: otp,
        verificationExpiry: otpExpiry
      }
    });

    const emailHtml = getOTPEmailTemplate(user.fullName, otp);
    
    const emailSent = await sendEmail({
      to: email,
      subject: 'Verify Your Email - EduFlow ERP',
      html: emailHtml
    });

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresIn: 600 // 10 minutes in seconds
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while sending OTP' },
      { status: 500 }
    );
  }
}
