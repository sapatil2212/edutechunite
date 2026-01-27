import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()

// Middleware to verify super admin
async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('super-admin-token')?.value

  if (!token) {
    return { authenticated: false, error: 'Not authenticated' }
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    if (payload.role !== 'SUPER_ADMIN') {
      return { authenticated: false, error: 'Access denied' }
    }

    return { authenticated: true, userId: payload.id as string }
  } catch {
    return { authenticated: false, error: 'Invalid token' }
  }
}

interface StatusUpdateRequest {
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'PENDING_VERIFICATION'
  reason?: string
  notifyAdmin?: boolean
}

// PATCH - Update institution status (block/unblock/suspend)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: 401 }
    )
  }

  try {
    const { id } = params
    const body: StatusUpdateRequest = await request.json()
    const { status, reason, notifyAdmin = true } = body

    // Validate status
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'PENDING_VERIFICATION']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      )
    }

    // Check if institution exists
    const institution = await prisma.school.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: 'SCHOOL_ADMIN' },
          select: { email: true, fullName: true },
          take: 1,
        },
      },
    })

    if (!institution) {
      return NextResponse.json(
        { success: false, message: 'Institution not found' },
        { status: 404 }
      )
    }

    const previousStatus = institution.status

    // Update institution status
    const updatedInstitution = await prisma.school.update({
      where: { id },
      data: {
        status,
        // If reactivating, also update verification
        ...(status === 'ACTIVE' && !institution.isVerified
          ? { isVerified: true, verifiedAt: new Date() }
          : {}),
      },
    })

    // Update all users' status based on institution status
    let userStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' = 'ACTIVE'
    if (status === 'SUSPENDED') {
      userStatus = 'SUSPENDED'
    } else if (status === 'INACTIVE') {
      userStatus = 'INACTIVE'
    }

    await prisma.user.updateMany({
      where: { schoolId: id },
      data: { status: userStatus },
    })

    // Send notification email to admin if requested
    if (notifyAdmin && institution.users[0]) {
      const admin = institution.users[0]
      const emailContent = getStatusChangeEmail(
        admin.fullName,
        institution.name,
        previousStatus,
        status,
        reason
      )

      await sendEmail({
        to: admin.email,
        subject: `Institution Status Update - ${institution.name}`,
        html: emailContent,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Institution ${status === 'SUSPENDED' ? 'suspended' : status === 'ACTIVE' ? 'activated' : 'updated'} successfully`,
      data: {
        id: updatedInstitution.id,
        schoolId: updatedInstitution.schoolId,
        name: updatedInstitution.name,
        previousStatus,
        newStatus: updatedInstitution.status,
      },
    })

  } catch (error) {
    console.error('Update institution status error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update institution status' },
      { status: 500 }
    )
  }
}

function getStatusChangeEmail(
  adminName: string,
  institutionName: string,
  previousStatus: string,
  newStatus: string,
  reason?: string
): string {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: '#dcfce7', text: '#166534', label: 'Active' },
    SUSPENDED: { bg: '#fef2f2', text: '#991b1b', label: 'Suspended' },
    INACTIVE: { bg: '#f3f4f6', text: '#374151', label: 'Inactive' },
    PENDING_VERIFICATION: { bg: '#fef3c7', text: '#92400e', label: 'Pending Verification' },
  }

  const statusInfo = statusColors[newStatus] || statusColors.ACTIVE

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Institution Status Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Institution Status Update</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Dear <strong>${adminName}</strong>,
                  </p>
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    We're writing to inform you that the status of your institution <strong>${institutionName}</strong> has been updated.
                  </p>
                  
                  <!-- Status Badge -->
                  <table role="presentation" style="width: 100%; margin: 30px 0;">
                    <tr>
                      <td style="text-align: center;">
                        <span style="display: inline-block; padding: 12px 32px; background-color: ${statusInfo.bg}; color: ${statusInfo.text}; font-size: 18px; font-weight: 600; border-radius: 50px;">
                          Status: ${statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  </table>
                  
                  ${reason ? `
                  <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">Reason:</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">${reason}</p>
                  </div>
                  ` : ''}
                  
                  ${newStatus === 'SUSPENDED' ? `
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px 20px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                      <strong>Important:</strong> While suspended, users from your institution will not be able to access the platform. Please contact support if you believe this is an error.
                    </p>
                  </div>
                  ` : ''}
                  
                  ${newStatus === 'ACTIVE' ? `
                  <div style="background-color: #dcfce7; border: 1px solid #bbf7d0; padding: 16px 20px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                      <strong>Great news!</strong> Your institution is now active. All users can access the platform normally.
                    </p>
                  </div>
                  ` : ''}
                  
                  <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    If you have any questions, please contact our support team.
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

