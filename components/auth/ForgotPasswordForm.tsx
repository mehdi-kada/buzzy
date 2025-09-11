'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const result = await resetPassword(email);
    if (!result.success) {
      setError(result.error || 'Failed to send email');
    } else {
      setMessage('Password reset email sent! Check your inbox.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/40">
      <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">Reset Password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-amber-900 dark:text-amber-200">
            Email Address
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

        {error && (
          <div className="text-red-600 dark:text-red-300 text-sm">{error}</div>
        )}

        {message && (
          <div className="text-green-700 dark:text-green-300 text-sm">{message}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Reset Email'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/auth/login" className="text-sm text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
