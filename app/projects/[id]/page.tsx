'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { databases, storage, DATABASE_ID, VIDEOS_COLLECTION_ID } from '@/lib/appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { Query } from 'appwrite';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Scissors } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';
import type { Video, Clip } from '@/types';
import { formatTime, formatClipDuration, formatFileSize } from '@/lib/projects/helperFunctions';
import ClipsSection from '@/components/projects/ClipsSection';
import TranscriptSection from '@/components/projects/TranscriptSection';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingClip, setDownloadingClip] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjectData();
    }
  }, [projectId, user]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch video with transcript relationship
      const videoResponse = await databases.getDocument(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        projectId,[
          Query.select(['*', 'transcript.*']) // Fetch all video fields and related transcript fields
        ]
      );


      const videoData = videoResponse as unknown as Video;
      
      // Check if user owns this project
      if (videoData.userId !== user?.$id) {
        setError('You do not have permission to view this project');
        return;
      }
      
      setVideo(videoData);

      // Fetch clips if they exist
      if (videoData.clipIds && videoData.clipIds.length > 0) {
        const clipsResponse = await databases.listDocuments(
          DATABASE_ID,
          'clips',
          [
            Query.equal('videoId', projectId),
            Query.equal('userId', user!.$id),
            Query.orderAsc('startTime')
          ]
        );
        setClips(clipsResponse.documents as unknown as Clip[]);
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const downloadClip = async (clip: Clip) => {
    try {
      setDownloadingClip(clip.$id);
      
      // Use the clips bucket ID from environment or fallback
      const clipsBucketId = process.env.NEXT_PUBLIC_APPWRITE_CLIPS_BUCKET_ID || 'clips';
      
      // Get download URL from storage
      const downloadUrl = storage.getFileDownload(clipsBucketId, clip.bucketFileId);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl.toString();
      link.download = clip.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Clip download started');
    } catch (err) {
      console.error('Error downloading clip:', err);
      toast.error('Failed to download clip. Please try again.');
    } finally {
      setDownloadingClip(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !video) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
            <p className="text-gray-600 mb-4">{error || 'The requested project could not be found.'}</p>
            <Button onClick={() => router.push('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/projects')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{video.title}</h1>
                {video.description && (
                  <p className="text-gray-600 mb-4">{video.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {video.duration ? formatTime(video.duration) : 'Unknown duration'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Scissors className="h-4 w-4" />
                    {clips.length} clips generated
                  </div>
                  <Badge variant={video.status === 'completed' ? 'default' : 'secondary'}>
                    {video.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript Section */}
          {video.transcript && (
            <TranscriptSection video={video} />
          )}

          {/* Clips Section */}
          <ClipsSection 
            clips={clips} 
            video={video} 
            onDownloadClip={downloadClip}
            downloadingClip={downloadingClip}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
