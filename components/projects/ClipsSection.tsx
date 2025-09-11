'use client';

import { Clip, Video } from '@/types';
import { storage } from '@/lib/appwrite';
import { formatClipDuration, formatFileSize } from '@/lib/projects/helperFunctions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Download, Maximize2, Play, Scissors } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMemo, useState } from 'react';

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
  // Buckets
  const clipsBucketId = useMemo(
    () => process.env.NEXT_PUBLIC_APPWRITE_CLIPS_BUCKET_ID || 'clips',
    []
  );
  const clipThumbsBucketId = useMemo(
    () => process.env.NEXT_PUBLIC_APPWRITE_CLIP_THUMBNAILS_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_THUMBNAILS_BUCKET_ID || 'thumbnails',
    []
  );

  // UI state
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  const getClipViewUrl = (clip: Clip) =>
    storage.getFileView(clipsBucketId, clip.bucketFileId).toString();

  const getClipThumbUrl = (clip: Clip) => {
    if (!clip.thumbnailFileId) return '';
    try {
      // Large, crisp preview for cards
      return storage
        .getFilePreview(clipThumbsBucketId, clip.thumbnailFileId, 1280, 720)
        .toString();
    } catch {
      return '';
    }
  };

  const openBigView = (clip: Clip) => {
    setSelectedClip(clip);
    setIsDialogOpen(true);
  };

  const handleViewClip = (clip: Clip) => {
    // Keep existing behavior: open in new tab
    const viewUrl = storage.getFileView(clipsBucketId, clip.bucketFileId);
    window.open(viewUrl.toString(), '_blank');
  };

  return (
    <Card className="border-0 shadow-none bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-950 dark:to-gray-900">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-200 dark:ring-amber-800">
              <Scissors className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Buzzler Clips <span className="text-amber-700/70 dark:text-amber-300/80 font-normal">({clips.length})</span>
            </h3>
          </div>
          {clips.length > 0 && (
            <Badge className="bg-amber-600/90 text-white hover:bg-amber-600">{video.status}</Badge>
          )}
        </div>
        
        {clips.length === 0 ? (
          <div className="text-center py-12 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-gray-900/60">
            <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-900/40 w-fit mx-auto mb-4 ring-1 ring-amber-200 dark:ring-amber-800">
              <Scissors className="h-8 w-8 text-amber-500 dark:text-amber-300" />
            </div>
            <h4 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">No clips yet</h4>
            <p className="text-amber-800/80 dark:text-amber-200/80 max-w-md mx-auto">
              {video.status !== 'completed' 
                ? "Clips will be available once processing is complete. Please check back in a few minutes." 
                : "Create your first clip to get started."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clips.map((clip, index) => (
              <Card 
                key={clip.$id} 
                className="overflow-hidden border border-amber-100 dark:border-amber-900/40 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 rounded-xl"
              >
                <CardContent className="p-0">
                  {/* Media area: thumbnail with play overlay OR inline player when active */}
                  <div className="relative group">
                    <div className="overflow-hidden rounded-t-xl">
                      {activeClipId === clip.$id ? (
                        <AspectRatio ratio={16/9}>
                          <video
                            key={clip.$id}
                            src={getClipViewUrl(clip)}
                            className="h-full w-full object-cover bg-black"
                            controls
                            autoPlay
                            poster={getClipThumbUrl(clip) || undefined}
                            onPlay={() => setActiveClipId(clip.$id)}
                            onEnded={() => setActiveClipId(null)}
                          />
                        </AspectRatio>
                      ) : (
                        <AspectRatio ratio={16/9}>
                          {getClipThumbUrl(clip) ? (
                            <img
                              src={getClipThumbUrl(clip)}
                              alt={`Clip ${index + 1} thumbnail`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                              <Scissors className="h-8 w-8 text-amber-500 dark:text-amber-300" />
                            </div>
                          )}
                        </AspectRatio>
                      )}
                    </div>
                    {activeClipId !== clip.$id && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors duration-300 rounded-t-xl">
                        <Button 
                          size="icon" 
                          className="rounded-full h-12 w-12 bg-amber-500 text-white hover:bg-amber-600 shadow-lg"
                          onClick={() => setActiveClipId(clip.$id)}
                          aria-label={`Play clip ${index + 1}`}
                        >
                          <Play className="h-5 w-5 ml-1" />
                        </Button>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {formatClipDuration(clip.duration)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Clip {index + 1}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatClipDuration(clip.startTime)} - {formatClipDuration(clip.endTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          {formatFileSize(clip.sizeBytes)}
                        </p>
                      </div>
                    </div>

                    {clip.text && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {clip.text}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadClip(clip)}
                        disabled={downloadingClip === clip.$id}
                        className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/30"
                      >
                        {downloadingClip === clip.$id ? (
                          <>
                            <LoadingSpinner className="h-3 w-3 mr-1" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openBigView(clip)}
                        className="px-3 bg-amber-600 hover:bg-amber-700 text-white"
                        aria-label="Open big view"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActiveClipId(activeClipId === clip.$id ? null : clip.$id)}
                        className="px-3"
                        aria-label="Toggle inline play"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Big view dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
                Clip Preview
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-4">
              {selectedClip && (
                <div className="rounded-lg overflow-hidden border border-amber-100 dark:border-amber-900/40">
                  <AspectRatio ratio={16/9}>
                    <video
                      src={selectedClip ? getClipViewUrl(selectedClip) : undefined}
                      className="h-full w-full object-contain bg-black"
                      controls
                      autoPlay
                      poster={selectedClip ? getClipThumbUrl(selectedClip) : undefined}
                    />
                  </AspectRatio>
                </div>
              )}
            </div>
            <DialogFooter className="px-6 pb-6 gap-2 sm:gap-2">
              {selectedClip && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onDownloadClip(selectedClip)}
                    disabled={downloadingClip === selectedClip.$id}
                    className="border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/30"
                  >
                    {downloadingClip === selectedClip.$id ? (
                      <>
                        <LoadingSpinner className="h-3 w-3 mr-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download clip
                      </>
                    )}
                  </Button>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => selectedClip && handleViewClip(selectedClip)}
                  >
                    Open in new tab
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}