import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-fallback-secret'

export async function middleware(request: NextRequest) {
  // Only handle /api/institution routes (mobile API endpoints)
  if (request.nextUrl.pathname.startsWith('/api/institution')) {
    const authHeader = request.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const secret = new TextEncoder().encode(JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)
        
        // Create a modified request with user data in headers
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', payload.id as string)
        requestHeaders.set('x-user-email', payload.email as string)
        requestHeaders.set('x-user-role', payload.role as string)
        requestHeaders.set('x-user-schoolId', (payload.schoolId as string) || '')
        requestHeaders.set('x-user-studentId', (payload.studentId as string) || '')
        requestHeaders.set('x-user-guardianId', (payload.guardianId as string) || '')
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      } catch (error) {
        // Invalid token, but don't block - let NextAuth handle it
        console.log('Invalid JWT token:', error)
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/institution/:path*',
}
