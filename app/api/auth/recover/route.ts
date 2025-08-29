import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/server/appwrite';

// Sends password recovery email
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }
    const { account } = await createAdminClient();
    await account.createRecovery(email, `${process.env.NEXT_PUBLIC_APP_URL || ''}/reset-password`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Recovery failed' }, { status: 400 });
  }
}
