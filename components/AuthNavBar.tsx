'use client';

import Link from 'next/link';

export default function AuthNavBar() {
  return (
    <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          Buzzler
        </Link>
        <div className="flex gap-3">
          <Link 
            href="/auth/login" 
            className="px-4 py-2 rounded-md text-amber-800 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200"
          >
            Login
          </Link>
          <Link 
            href="/auth/register" 
            className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 shadow-sm ring-1 ring-amber-300/60"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}