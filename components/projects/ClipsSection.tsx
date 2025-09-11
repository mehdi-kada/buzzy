'use client';

import { Clip, Video } from '@/types';
import { storage } from '@/lib/appwrite';
import { formatClipDuration, formatFileSize } from '@/lib/projects/helperFunctions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Play, Scissors } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState } from 'react';
import { toast } from 'sonner';

interface ClipsSectionProps {
  clips: Clip[];
  video: Video;
  onDownloadClip: (clip: Clip) => void;
  downloadingClip: string | null;
}

export default function ClipsSection({ 
  clips, 
  video, 
  onDownloadClip,
  downloadingClip
}: ClipsSectionProps) {
  const handleViewClip = (clip: Clip) => {
    const clipsBucketId = process.env.NEXT_PUBLIC_APPWRITE_CLIPS_BUCKET_ID || 'clips';
    const viewUrl = storage.getFileView(clipsBucketId, clip.bucketFileId);
    window.open(viewUrl.toString(), '_blank');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scissors className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Generated Clips ({clips.length})</h3>
        </div>
        
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
                      onClick={() => onDownloadClip(clip)}
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
                      onClick={() => handleViewClip(clip)}
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
  );
}