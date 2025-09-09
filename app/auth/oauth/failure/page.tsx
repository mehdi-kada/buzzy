'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuthFailure() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page with error after 3 seconds
    const timer = setTimeout(() => {
      router.push('/auth/login?error=oauth_failed');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Authentication Failed</h2>
        <p className="mt-2 text-gray-600">
          We couldn't complete your authentication with Google. You'll be redirected to the login page shortly.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          If you're not redirected automatically, <a href="/auth/login" className="text-blue-600 hover:text-blue-500">click here</a>.
        </p>
      </div>
    </div>
  );
}