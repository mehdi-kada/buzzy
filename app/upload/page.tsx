'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VideoUploader from "@/components/VideoUploader";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function UploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-12">
        <VideoUploader />
      </div>
    </div>
  );
}