'use client';

import { use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProjectDetailsClient from './client';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner className="h-32 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ProjectDetailsClient params={resolvedParams} userId={user.$id} />;
}