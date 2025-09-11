// app/auth/oauth/failure/page.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OAuthFailureContent() {
  const params = useSearchParams();
  const error = params.get('error') || 'OAuth sign-in failed';
  return (
    <main className="p-6 min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/40 rounded-xl shadow-sm p-6">
        <p className="mb-4 text-amber-900 dark:text-amber-100">{error}</p>
        <Link href="/auth/login" className="underline text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
          Try again
        </Link>
      </div>
    </main>
  );
}

export default function OAuthFailurePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OAuthFailureContent />
    </Suspense>
  );
}
