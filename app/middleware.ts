import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow public routes
  const isPublicPath = path === '/auth/login' || path === '/auth/register';

  // Get token from cookies
  const token = request.cookies.get('token')?.value || '';

  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.nextUrl));
  }

  // Always return a response
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/auth/login',
    '/auth/register',
    '/company/:path*',
  ]
};