import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/server/appwrite';
import { ID } from 'node-appwrite';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    const { account } = await createAdminClient();
    await account.create(ID.unique(), email, password, name || undefined);
    const session = await account.createEmailPasswordSession(email, password);
    const res = NextResponse.json({ success: true });
    res.cookies.set({
      name: 'appwrite-session',
      value: session.secret,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Registration failed' }, { status: 400 });
  }
}
