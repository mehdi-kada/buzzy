import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/server/appwrite';

export async function middleware(request: any) {
  const user = await getLoggedInUser();
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];

  // Public routes that redirect to dashboard if user is logged in
  const authRoutes = ['/login', '/register'];

  // Check if the current path is a protected route
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Check if the current path is an auth route
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/login',
    '/register'
  ]
};
