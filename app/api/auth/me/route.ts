import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/server/appwrite';

export async function GET() {
  const user = await getLoggedInUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user }, { status: 200 });
}
