import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

// Define public routes that don't require authentication
const publicRoutes = [
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/webhooks/stripe',
  '/api/doctors/search',
  '/api/doctors/[id]',
  '/api/doctors/[id]/availability',
];

// Define admin-only routes
const adminRoutes = [
  '/api/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Get authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json(
      { message: 'Authorization token required' },
      { status: 401 }
    );
  }
  
  // Verify token
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return NextResponse.json(
      { message: 'Invalid or expired token' },
      { status: 401 }
    );
  }
  
  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }
  }
  
  // Add user info to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/api/((?!auth|webhooks|doctors/search|doctors/\\[id\\]|doctors/\\[id\\]/availability).*)',
  ],
};
