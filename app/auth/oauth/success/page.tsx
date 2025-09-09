'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { useAuth } from '@/contexts/AuthContext';

export default function OAuthSuccess() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        // Get the current session to verify authentication
        await account.getSession('current');
        
        // Update the auth context with the new user data
        await checkAuth();
        setChecked(true);
        
        // Redirect immediately to dashboard
        router.push('/dashboard');
      } catch (error) {
        // If there's an error, redirect to login with error message
        router.push('/auth/login?error=oauth_failed');
      }
    };

    handleOAuthSuccess();
  }, [router, checkAuth]);

  // If we've checked auth and still haven't redirected, show a simple message
  if (checked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
