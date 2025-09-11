'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { storage } from '@/lib/appwrite';
import { formatTime } from '@/lib/projects/helperFunctions';
import type { Video } from '@/types';

interface TranscriptSectionProps {
  video: Video;
}

export default function TranscriptSection({ video }: TranscriptSectionProps) {
  const [downloadingTranscript, setDownloadingTranscript] = useState(false);

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

  if (!video.transcript) {
    return null;
  }

  return (
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
  );
}