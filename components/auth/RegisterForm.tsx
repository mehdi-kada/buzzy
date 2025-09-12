'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OAuthButtons from './OAuthButtons';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    const result = await register(formData.email, formData.password, formData.name);

    if (result.success) {
      router.push('/projects');
    } else {
      setError(result.error || 'Registration failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/40">
      <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">Create Account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-amber-900 dark:text-amber-200">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-amber-200 dark:border-amber-900/40 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-amber-900 dark:text-amber-200">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
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
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-amber-200 dark:border-amber-900/40 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-amber-900 dark:text-amber-200">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
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
          {isLoading ? 'Creating Account...' : 'Create Account'}
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
  <span className="text-sm text-amber-900/80 dark:text-amber-200/80">Already have an account? </span>
  <Link href="/auth/login" className="text-sm text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
          Sign in
        </Link>
      </div>
    </div>
  );
}
