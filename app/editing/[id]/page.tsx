
"use client";

import { VideoTranscriptPlayer } from '@/components/VideoTranscriptPlayer';
import { useParams } from 'next/navigation';
import { storage } from '@/lib/appwrite';

export default function EditingPage() {
  const params = useParams();
  const videoId = params.id as string;
  
  if (!videoId) {
    return <div>Video ID not found</div>;
  }

  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
  const videoSrc = storage.getFileView(bucketId, videoId);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editing Video: {videoId}</h1>
      
      <VideoTranscriptPlayer 
        videoId={videoId} 
        videoSrc={videoSrc}
        editable={true}
      />
    </div>
  );
}
