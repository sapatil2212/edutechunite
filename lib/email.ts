import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  try {
    console.log(`Attempting to send email to: ${to} with subject: ${subject}`)
    const info = await transporter.sendMail({
      from: `"EduFlow ERP" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html,
    })
    console.log(`Email sent successfully: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('Detailed Email sending failure:', error)
    return false
  }
}

export function getVerificationEmailTemplate(name: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to EduFlow!</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hi <strong>${name}</strong>,
                  </p>
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Thank you for registering your institution with EduFlow ERP. Please verify your email address to complete the setup and unlock all features.
                  </p>
                  
                  <table role="presentation" style="width: 100%; margin: 30px 0;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background-color: #E5F33C; color: #0A0A0A; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                          Verify Email Address
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Or copy and paste this link in your browser:
                  </p>
                  <p style="margin: 0 0 20px; color: #047857; font-size: 14px; word-break: break-all;">
                    ${verificationUrl}
                  </p>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} EduFlow ERP. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function getWelcomeEmailTemplate(name: string, schoolName: string, schoolId: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to EduFlow</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 You're All Set!</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hi <strong>${name}</strong>,
                  </p>
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Congratulations! Your institution <strong>${schoolName}</strong> has been successfully registered with EduFlow ERP.
                  </p>
                  
                  <table role="presentation" style="width: 100%; background-color: #f0fdf4; border-radius: 12px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 10px; color: #065f46; font-size: 14px; font-weight: 600;">Your Institution ID</p>
                        <p style="margin: 0; color: #047857; font-size: 24px; font-weight: 700; letter-spacing: 2px;">${schoolId}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Save this ID for future reference. You can now access your dashboard and start managing your institution.
                  </p>
                  
                  <table role="presentation" style="width: 100%; margin: 30px 0;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; padding: 16px 40px; background-color: #E5F33C; color: #0A0A0A; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                          Go to Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} EduFlow ERP. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function getTeacherWelcomeEmailTemplate(
  teacherName: string,
  email: string,
  password: string,
  schoolName: string,
  loginUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to EduFlow - Teacher Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to EduFlow!</h1>
                  <p style="margin: 10px 0 0; color: #d1fae5; font-size: 16px;">Your Teacher Account is Ready</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hi <strong>${teacherName}</strong>,
                  </p>
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Your teacher account has been created at <strong>${schoolName}</strong>. You can now access the Teacher Portal to manage your classes, assignments, and more.
                  </p>
                  
                  <table role="presentation" style="width: 100%; background-color: #ecfdf5; border-radius: 12px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 15px; color: #065f46; font-size: 14px; font-weight: 600;">Your Login Credentials</p>
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                            <td style="padding: 8px 0; color: #047857; font-size: 14px; font-weight: 600;">${email}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Password:</td>
                            <td style="padding: 8px 0; color: #047857; font-size: 14px; font-weight: 600;">${password}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0; color: #dc2626; font-size: 14px; line-height: 1.6; background-color: #fef2f2; padding: 12px; border-radius: 8px;">
                    ⚠️ Please change your password after your first login for security purposes.
                  </p>
                  
                  <table role="presentation" style="width: 100%; margin: 30px 0;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${loginUrl}" style="display: inline-block; padding: 16px 40px; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                          Login to Teacher Portal
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} EduFlow ERP. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function getTeacherRegistrationNotificationTemplate(
  recipientName: string,
  teacherName: string,
  teacherEmail: string,
  schoolName: string,
  hasLogin: boolean
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Teacher Registered</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">New Teacher Registered</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hi <strong>${recipientName}</strong>,
                  </p>
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    A new teacher has been registered at <strong>${schoolName}</strong>.
                  </p>
                  
                  <table role="presentation" style="width: 100%; background-color: #f0f9ff; border-radius: 12px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 15px; color: #1e40af; font-size: 14px; font-weight: 600;">Teacher Details</p>
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name:</td>
                            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${teacherName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${teacherEmail || 'Not provided'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Login Access:</td>
                            <td style="padding: 8px 0; color: ${hasLogin ? '#059669' : '#6b7280'}; font-size: 14px; font-weight: 500;">${hasLogin ? 'Enabled' : 'Not enabled'}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" style="width: 100%; margin: 30px 0;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${process.env.NEXTAUTH_URL}/dashboard/academic/teachers" style="display: inline-block; padding: 16px 40px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                          View Teachers
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} EduFlow ERP. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function getStudentWelcomeEmailTemplate(
  studentName: string,
  admissionNumber: string,
  password: string,
  schoolName: string,
  loginUrl: string,
  resetUrl: string,
  academicInfo: { class: string; section: string; year: string }
): string {
  const currentYear = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${schoolName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0; text-align: center;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; text-align: left;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 700;">Welcome to ${schoolName}</h1>
                  <p style="margin: 10px 0 0; color: #64748b; font-size: 16px;">Student Registration Successful</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px;">
                  <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                    Hello <strong>${studentName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px; color: #334155; font-size: 16px; line-height: 1.6;">
                    Your profile has been created at <strong>${schoolName}</strong> for the academic year <strong>${academicInfo.year}</strong>. Below are your admission and login details.
                  </p>
                  
                  <!-- Student Info Table -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">
                    <tr style="background-color: #f8fafc;">
                      <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Admission No.</td>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; font-weight: 600;">${admissionNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Class</td>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; font-weight: 600;">${academicInfo.class}</td>
                    </tr>
                    <tr style="background-color: #f8fafc;">
                      <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Section</td>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; font-weight: 600;">${academicInfo.section}</td>
                    </tr>
                  </table>

                  <!-- Credentials -->
                  <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 30px;">
                    <p style="margin: 0 0 16px; color: #475569; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Credentials</p>
                    
                    <div style="margin-bottom: 16px;">
                      <label style="display: block; color: #64748b; font-size: 12px; margin-bottom: 4px;">Username (Admission Number)</label>
                      <div style="display: flex; align-items: center; background-color: #ffffff; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 8px;">
                        <span style="color: #1e293b; font-family: monospace; font-size: 16px; flex-grow: 1;">${admissionNumber}</span>
                      </div>
                    </div>

                    <div>
                      <label style="display: block; color: #64748b; font-size: 12px; margin-bottom: 4px;">Temporary Password</label>
                      <div style="display: flex; align-items: center; background-color: #ffffff; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 8px;">
                        <span style="color: #1e293b; font-family: monospace; font-size: 16px; flex-grow: 1;">${password}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px;">
                      Log In to Dashboard
                    </a>
                  </div>

                  <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
                    Need to change your password? <a href="${resetUrl}" style="color: #2563eb; text-decoration: none; font-weight: 500;">Reset it here</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                    © ${currentYear} ${schoolName}. Powered by EduFlow ERP.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function getPasswordResetNotificationTemplate(
  userName: string,
  schoolName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset Successful</title>
    </head>
    <body style="font-family: sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
        <h2 style="color: #10b981;">Password Reset Successful</h2>
        <p>Hello,</p>
        <p>The password for <strong>${userName}</strong> at <strong>${schoolName}</strong> has been successfully reset.</p>
        <p>If you did not perform this action, please contact the institution administrator immediately.</p>
        <p>Regards,<br>EduFlow Team</p>
      </div>
    </body>
    </html>
  `
}

