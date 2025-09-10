// app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  if (loading) return <p className="p-6">Loading…</p>;
  if (!user) return null; // prevent UI flash while redirecting

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-2">Dashboard</h1>
      <p className="mb-1">Name: {user.name || user.email}</p>
      <p className="mb-1">Email: {user.email}</p>
      <p className="mb-1">User ID: {user.$id}</p>
      <p className="text-sm text-gray-600">
        Email Verified: {user.emailVerification ? 'Yes' : 'No'}
      </p>
    </main>
  );
}
