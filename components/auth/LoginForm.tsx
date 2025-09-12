'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import OAuthButtons from './OAuthButtons';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for OAuth error
  const oauthError = searchParams.get('error');
  useEffect(() => {
    if (oauthError === 'oauth_failed') {
      setError('Google authentication failed. Please try again.');
    }
  }, [oauthError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      router.replace('/projects');
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/40">
      <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">Login</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-amber-900 dark:text-amber-200">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-amber-200 dark:border-amber-900/40 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-amber-900 dark:text-amber-200">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-amber-200 dark:border-amber-900/40 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 dark:text-red-300 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-amber-100 dark:border-amber-900/40"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-900 px-2 text-amber-800/80 dark:text-amber-300/80">
            Or continue with
          </span>
        </div>
      </div>
      <OAuthButtons />

      <div className="mt-4 text-center">
        <Link href="/auth/forgot-password" className="text-sm text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
          Forgot your password?
        </Link>
      </div>

      <div className="mt-4 text-center">
        <span className="text-sm text-amber-900/80 dark:text-amber-200/80">Don't have an account? </span>
        <Link href="/auth/register" className="text-sm text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
          Sign up
        </Link>
      </div>
    </div>
  );
}
