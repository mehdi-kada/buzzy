import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/server/appwrite';
import { Client, Account, ID } from 'node-appwrite';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    const { account } = await createAdminClient();
  await account.create(ID.unique(), email, password, name || undefined);
  const session = await account.createEmailPasswordSession(email, password);

    // Attempt to send verification email using the newly created user session
    let verificationSent = false;
    let verificationId: string | undefined;
    try {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setSession(session.secret);

      const userAccount = new Account(client);
      const verification = await userAccount.createVerification('http://localhost:3000');
      verificationSent = true;
      verificationId = (verification as any).$id; // $id present in Appwrite models
    } catch (err) {
      console.error('Failed to send verification email after registration', err);
    }

    const res = NextResponse.json({ success: true, verificationSent, verificationId });
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
