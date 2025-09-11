'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VideoUploader from "@/components/VideoUploader";
import ImportVideo from "@/components/ImportVideo";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'import'>('upload');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
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
    <div className="min-h-screen">
      <div className="py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex border-b border-amber-200 dark:border-amber-900/40 mb-8">
            <Button
              variant={activeTab === 'upload' ? 'default' : 'ghost'}
              className={"rounded-b-none " + (activeTab === 'upload' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'text-amber-700 hover:text-amber-800 dark:text-amber-300')}
              onClick={() => setActiveTab('upload')}
            >
              Upload Video
            </Button>
            <Button
              variant={activeTab === 'import' ? 'default' : 'ghost'}
              className={"rounded-b-none " + (activeTab === 'import' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'text-amber-700 hover:text-amber-800 dark:text-amber-300')}
              onClick={() => setActiveTab('import')}
            >
              Import from URL
            </Button>
          </div>
          
          {activeTab === 'upload' ? <VideoUploader /> : <ImportVideo />}
        </div>
      </div>
    </div>
  );
}