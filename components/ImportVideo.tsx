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
      // Call Appwrite function to import video
      const exec = await functions.createExecution(
        IMPORT_VIDEO_FUNCTION_ID,
        JSON.stringify({
          video_url: url,
          bucket_id: BUCKET_ID,
        })
      );

      // The function returns a JSON body via context.response.json({...})
      let fileUrl: string | undefined;
      const respStr = (exec as any)?.response ?? (exec as any)?.responseBody ?? '';
      const execStatus = (exec as any)?.status || '';
      const execErrors = (exec as any)?.errors;
      try {
        const parsed = respStr && typeof respStr === 'string' ? JSON.parse(respStr) : {};
        fileUrl = parsed?.file_url;
      } catch (_) {
        /* ignore parse errors */
      }

      if (execStatus && execStatus !== 'completed') {
        throw new Error(execErrors || 'Import function execution failed');
      }

      if (!fileUrl) {
        throw new Error('Import function did not return a file URL');
      }

      // Optionally trigger transcription here once videoId is available.
      // NOTE: The import function currently returns only file_url (no videoId/document ID).
      // Uncomment and adapt once your function also returns a videoId.
      // await fetch('/api/transcribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ audioUrl: fileUrl, videoId, userId: user.$id }),
      // });

  toast.success('Success', { description: `Video imported. URL: ${fileUrl}` });
  setTimeout(() => router.push('/projects'), 1500);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Error', {
        description: error.message || 'Failed to import video',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Import Video from URL</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Video URL
          </label>
          <Input
            id="videoUrl"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            className="w-full"
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter a direct link to a video file (MP4, MOV, etc.)
          </p>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || !url.trim()}
          className="w-full"
        >
          {isLoading ? 'Importing...' : 'Import Video'}
        </Button>
      </form>
    </div>
  );
};

export default ImportVideo;