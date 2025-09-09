'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { databases, storage, DATABASE_ID, VIDEOS_COLLECTION_ID, BUCKET_ID } from '@/lib/appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { Query } from 'appwrite';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Play, FileText, ArrowLeft, Clock, Scissors } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';
import type { Video, ProjectTranscript, Clip } from '@/types';
import { formatTime, formatClipDuration, formatFileSize } from '@/lib/projects/helperFunctions';

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
  const [downloadingTranscript, setDownloadingTranscript] = useState(false);

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

  const downloadTranscript = async () => {
    if (!video?.transcript?.transcriptFileId) return;

    try {
      setDownloadingTranscript(true);
      
      // Use the transcript bucket ID from environment or fallback
      const transcriptBucketId = process.env.NEXT_PUBLIC_APPWRITE_TRANSCRIPT_BUCKET_ID || 'transcripts';
      
      // Get download URL from storage  
      const downloadUrl = storage.getFileDownload(transcriptBucketId, video.transcript.transcriptFileId);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl.toString();
      link.download = `${video.title}_transcript.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Transcript download started');
    } catch (err) {
      console.error('Error downloading transcript:', err);
      toast.error('Failed to download transcript. Please try again.');
    } finally {
      setDownloadingTranscript(false);
    }
  };



  const videoViewUrl = video ? storage.getFileView(BUCKET_ID, video.$id).toString() : '';

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

          {/* Main Video Preview */}
          <Card className="mb-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full bg-black">
                {/* Use a plain video tag for preview to avoid Next.js hydration issues */}
                {videoViewUrl && (
                  <video
                    key={videoViewUrl}
                    src={videoViewUrl}
                    controls
                    className="w-full h-auto"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transcript Section */}
          {video.transcript && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Full Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Language: {video.transcript.languageCode.toUpperCase()}</p>
                    <p>Confidence: {(video.transcript.confidence).toFixed(1)}%</p>
                    <p>Words: {video.transcript.wordsCount.toLocaleString()}</p>
                    <p>Duration: {formatTime(video.transcript.audioDurationSec)}</p>
                  </div>
                  <Button
                    onClick={downloadTranscript}
                    disabled={downloadingTranscript}
                    className="shrink-0"
                  >
                    {downloadingTranscript ? (
                      <LoadingSpinner className="h-4 w-4 mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download Transcript
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {video.transcript.text.substring(0, 500)}
                    {video.transcript.text.length > 500 && '...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clips Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Generated Clips ({clips.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clips.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No clips have been generated for this project yet.</p>
                  {video.status !== 'completed' && (
                    <p className="text-sm mt-2">Clips will be available once processing is complete.</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clips.map((clip) => (
                    <Card key={clip.$id} className="border border-gray-200">
                      <CardContent className="p-4">
                        {/* Clip inline preview */}
                        <div className="mb-3 overflow-hidden rounded-md">
                          <video
                            src={storage.getFileView(process.env.NEXT_PUBLIC_APPWRITE_CLIPS_BUCKET_ID || 'clips', clip.bucketFileId).toString()}
                            controls
                            className="w-full h-auto"
                          />
                        </div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="text-sm text-gray-600">
                            <p className="font-medium">Clip {clips.indexOf(clip) + 1}</p>
                            <p>{formatClipDuration(clip.startTime)} - {formatClipDuration(clip.endTime)}</p>
                            <p>Duration: {formatClipDuration(clip.duration)}</p>
                            <p>{formatFileSize(clip.sizeBytes)}</p>
                          </div>
                        </div>
                        
                        {clip.text && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 max-h-16 overflow-hidden">
                              {clip.text.length > 150 ? `${clip.text.substring(0, 150)}...` : clip.text}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadClip(clip)}
                            disabled={downloadingClip === clip.$id}
                            className="flex-1"
                          >
                            {downloadingClip === clip.$id ? (
                              <LoadingSpinner className="h-3 w-3 mr-1" />
                            ) : (
                              <Download className="h-3 w-3 mr-1" />
                            )}
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const clipsBucketId = process.env.NEXT_PUBLIC_APPWRITE_CLIPS_BUCKET_ID || 'clips';
                              const viewUrl = storage.getFileView(clipsBucketId, clip.bucketFileId);
                              window.open(viewUrl.toString(), '_blank');
                            }}
                            className="px-2"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
