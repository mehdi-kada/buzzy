import { NextResponse } from 'next/server';

export async function middleware(request: any) {
  // Currently using client-side authentication protection
  // Middleware protection is disabled to avoid SSR/CSR conflicts
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/auth/login',
    '/auth/register'
  ]
};
