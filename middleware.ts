import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-fallback-secret'

export async function middleware(request: NextRequest) {
  // Handle CORS
  const origin = request.headers.get('origin')
  
  // Define allowed origins
  const allowedOrigins = ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:3001']
  
  // Allow any localhost origin for development to support Flutter web dynamic ports
  const isLocalhost = origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:')
  const isAllowedOrigin = origin && (allowedOrigins.includes(origin) || isLocalhost)

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const headers = new Headers()
    if (isAllowedOrigin) {
      headers.set('Access-Control-Allow-Origin', origin)
      headers.set('Access-Control-Allow-Credentials', 'true')
    }
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Role, X-User-SchoolId, X-User-StudentId, X-User-GuardianId, X-User-TeacherId')
    headers.set('Access-Control-Max-Age', '86400')
    
    return new NextResponse(null, { headers, status: 200 })
  }

  const response = NextResponse.next()

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Role, X-User-SchoolId, X-User-StudentId, X-User-GuardianId, X-User-TeacherId')

  // Handle mobile API endpoints (/api/institution and /api/auth/mobile)
  const isMobileApiRoute = request.nextUrl.pathname.startsWith('/api/institution') || 
                           request.nextUrl.pathname.startsWith('/api/auth/mobile')
  
  if (isMobileApiRoute) {
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
        requestHeaders.set('x-user-teacherId', (payload.teacherId as string) || '')
        
        // Pass the modified headers to the next response
        const nextResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
        
        // Copy CORS headers to the new response
        if (isAllowedOrigin) {
          nextResponse.headers.set('Access-Control-Allow-Origin', origin)
        }
        nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        return nextResponse

      } catch (error) {
        // Invalid token, but don't block - let NextAuth handle it
        console.log('Invalid JWT token:', error)
      }
    }
  }
  
  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
