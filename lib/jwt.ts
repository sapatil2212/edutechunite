import { jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-fallback-secret'

export async function verifyJWT(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
}

export async function getJWTUser(req: NextRequest) {
  // First, try to get user from middleware headers
  const userId = req.headers.get('x-user-id')
  
  if (userId) {
    return {
      id: userId,
      email: req.headers.get('x-user-email') || '',
      role: req.headers.get('x-user-role') || '',
      schoolId: req.headers.get('x-user-schoolId') || null,
      studentId: req.headers.get('x-user-studentId') || null,
      guardianId: req.headers.get('x-user-guardianId') || null,
      teacherId: req.headers.get('x-user-teacherId') || null,
    }
  }
  
  // Fallback to direct JWT verification
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = await verifyJWT(token)
  
  if (!payload) {
    return null
  }

  return {
    id: payload.id as string,
    email: payload.email as string,
    role: payload.role as string,
    schoolId: payload.schoolId as string | null,
    studentId: payload.studentId as string | null | undefined,
    guardianId: payload.guardianId as string | null | undefined,
    teacherId: payload.teacherId as string | null | undefined,
  }
}
