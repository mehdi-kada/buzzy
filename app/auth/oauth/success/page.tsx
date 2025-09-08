'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';

export default function OAuthSuccess() {
  const router = useRouter();

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        // Check if we have a valid session
        try {
          await account.getSession('current');
          router.push('/dashboard');
        } catch {
          router.push('/auth/login?error=oauth_failed');
        }
      } catch (error) {
        router.push('/auth/login?error=oauth_failed');
      }
    };

    handleOAuthSuccess();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
