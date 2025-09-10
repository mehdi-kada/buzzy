// app/auth/oauth/failure/page.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function OAuthFailurePage() {
  const params = useSearchParams();
  const error = params.get('error') || 'OAuth sign-in failed';
  return (
    <main className="p-6">
      <p className="mb-4 text-red-600">{error}</p>
      <Link href="/auth/login" className="underline">
        Try again
      </Link>
    </main>
  );
}
