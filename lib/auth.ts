import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/utils/password'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Admission Number / Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Please enter your credentials')
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier.toLowerCase() },
              { username: credentials.identifier },
            ],
          },
          include: { 
            school: true,
            studentProfile: true,
            guardianProfile: true,
            teacherProfile: true,
          },
        })

        if (!user) {
          throw new Error('No account found with these credentials')
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email before logging in')
        }

        if (user.status === 'SUSPENDED') {
          throw new Error('Your account has been suspended. Please contact support.')
        }

        if (user.status === 'INACTIVE') {
          throw new Error('Your account is inactive. Please contact support.')
        }

        const isPasswordValid = await verifyPassword(credentials.password, user.password)

        if (!isPasswordValid) {
          // Log failed attempt
          await (prisma as any).loginLog.create({
            data: {
              userId: user.id,
              status: 'FAILED',
              reason: 'Invalid password',
              ipAddress: (req as any)?.headers?.['x-forwarded-for'] || (req as any)?.socket?.remoteAddress,
              userAgent: (req as any)?.headers?.['user-agent'],
            },
          })
          throw new Error('Invalid password')
        }

        // Update last login and log success
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { 
              lastLoginAt: new Date(),
              lastLoginIp: (req as any)?.headers?.['x-forwarded-for'] || (req as any)?.socket?.remoteAddress,
            },
          }),
          (prisma as any).loginLog.create({
            data: {
              userId: user.id,
              status: 'SUCCESS',
              ipAddress: (req as any)?.headers?.['x-forwarded-for'] || (req as any)?.socket?.remoteAddress,
              userAgent: (req as any)?.headers?.['user-agent'],
            },
          }),
        ])

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: (user as any).school?.name,
          institutionId: (user as any).school?.schoolId,
          studentId: (user as any).studentProfile?.id || null,
          guardianId: (user as any).guardianProfile?.id || null,
          teacherId: (user as any).teacherProfile?.id || null,
          mustChangePassword: (user as any).mustChangePassword,
        }
      },
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.schoolId = user.schoolId
        token.schoolName = user.schoolName
        token.institutionId = user.institutionId
        token.studentId = user.studentId
        token.guardianId = user.guardianId
        token.teacherId = user.teacherId
        token.mustChangePassword = (user as any).mustChangePassword
      }
      return token
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.schoolId = token.schoolId as string | null
        session.user.schoolName = token.schoolName as string | undefined
        session.user.institutionId = token.institutionId as string | undefined
        session.user.studentId = token.studentId as string | null | undefined
        session.user.guardianId = token.guardianId as string | null | undefined
        session.user.teacherId = token.teacherId as string | null | undefined
        session.user.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
  
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`)
    },
  },
  
  debug: false,
}

