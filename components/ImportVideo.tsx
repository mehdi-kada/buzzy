'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BUCKET_ID, functions, IMPORT_VIDEO_FUNCTION_ID } from '@/lib/appwrite';

const ImportVideo = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateUrl = (inputUrl: string) => {
    try {
      const parsedUrl = new URL(inputUrl);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Error', {
        description: 'Please enter a video URL',
      });
      return;
    }

    if (!validateUrl(url)) {
      toast.error('Error', {
        description: 'Please enter a valid URL',
      });
      return;
    }

    if (!user) {
      toast.error('Error', {
        description: 'You must be logged in to import a video',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Schedule Appwrite function to import video and redirect immediately
      functions.createExecution(
        IMPORT_VIDEO_FUNCTION_ID,
        JSON.stringify({
          video_url: url,
          bucket_id: BUCKET_ID,
          user_id: user.$id,
        }),
       true 
      );

      setShowSuccess(true);
      router.push('/projects');

      toast.success('Success', { description: 'Import started. You\'ll see it in Projects shortly.' });
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Error', {
        description: error.message || 'Failed to import video',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-amber-100 dark:border-amber-900/40">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Import Successful!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Your video is being processed. You'll be redirected to your projects page shortly.</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-amber-100 dark:border-amber-900/40">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">Import Video from URL</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
            Video URL
          </label>
          <Input
            id="videoUrl"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            className="w-full border-amber-200 focus-visible:ring-amber-500 dark:border-amber-900/40"
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
            Enter a direct link to a video file (MP4, MOV, etc.)
          </p>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || !url.trim()}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isLoading ? 'Importing...' : 'Import Video'}
        </Button>
      </form>
    </div>
  );
};

export default ImportVideo;