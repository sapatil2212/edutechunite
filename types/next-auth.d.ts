import 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: string
    schoolId: string | null
    schoolName?: string
    institutionId?: string
    studentId?: string | null
    guardianId?: string | null
    teacherId?: string | null
    mustChangePassword: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      schoolId: string | null
      schoolName?: string
      institutionId?: string
      studentId?: string | null
      guardianId?: string | null
      teacherId?: string | null
      mustChangePassword: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    schoolId: string | null
    schoolName?: string
    institutionId?: string
    studentId?: string | null
    guardianId?: string | null
    teacherId?: string | null
    mustChangePassword: boolean
  }
}

