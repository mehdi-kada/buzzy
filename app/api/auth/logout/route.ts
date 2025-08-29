import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/server/appwrite';

export async function POST() {
  await logoutUser();
  const res = NextResponse.json({ success: true });
  res.cookies.set({
    name: 'appwrite-session',
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  });
  return res;
}
