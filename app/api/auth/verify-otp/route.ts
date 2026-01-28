import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, getWelcomeEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
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

    if (!user.verificationToken) {
      return NextResponse.json(
        { success: false, message: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    if (user.verificationExpiry && new Date() > user.verificationExpiry) {
      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (user.verificationToken !== otp) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          verificationToken: null,
          verificationExpiry: null,
          status: 'ACTIVE'
        }
      });

      if (user.school && user.role === 'SCHOOL_ADMIN') {
        await tx.school.update({
          where: { id: user.school.id },
          data: {
            status: 'ACTIVE',
            isVerified: true,
            verifiedAt: new Date()
          }
        });
      }
    });

    if (user.school) {
      const emailHtml = getWelcomeEmailTemplate(
        user.fullName,
        user.school.name,
        user.school.schoolId
      );

      sendEmail({
        to: user.email,
        subject: `Welcome to EduFlow - ${user.school.name}`,
        html: emailHtml
      }).catch(error => {
        console.error('Failed to send welcome email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        schoolId: user.school?.schoolId,
        institutionName: user.school?.name
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
