"use client";

import { useState } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { TranscriptDisplay } from '@/components/TranscriptDisplay';
import { EditableTranscriptDisplay } from '@/components/EditableTranscriptDisplay';
import { useTranscript } from '@/hooks/useTranscript';
import { AAIWord } from '@/interfaces/transcripts';

interface VideoTranscriptPlayerProps {
  videoId: string;
  videoSrc: string;
  editable?: boolean;
}

export function VideoTranscriptPlayer({ 
  videoId, 
  videoSrc,
  editable = false
}: VideoTranscriptPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const { transcript, words, loading, error } = useTranscript(videoId);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleWordClick = (word: AAIWord) => {
    // Seek to the word's start time
    const videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.currentTime = word.start;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading transcript...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-500">Error loading transcript: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Side-by-side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript Display - Left side (takes 2/3 on large screens) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="border-b px-4 py-3">
            <h2 className="text-xl font-semibold">
              {editable ? 'Editable Transcript' : 'Transcript'}
            </h2>
          </div>
          <div className="p-4">
            {editable ? (
              <EditableTranscriptDisplay 
                words={words} 
                currentTime={currentTime}
                onWordClick={handleWordClick}
                onWordsUpdate={(updatedWords) => {
                  console.log('Updated words:', updatedWords);
                  // Here you would typically save the updated transcript to your database
                }}
              />
            ) : (
              <TranscriptDisplay 
                words={words} 
                currentTime={currentTime}
                onWordClick={handleWordClick}
              />
            )}
          </div>
        </div>

        {/* Video Player - Right side (takes 1/3 on large screens) */}
        <div className="lg:col-span-1">
          <div className="bg-black rounded-xl overflow-hidden aspect-video lg:aspect-square">
            <VideoPlayer 
              src={videoSrc} 
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}