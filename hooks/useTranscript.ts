import { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { AAIWord } from '@/interfaces/transcripts';

interface TranscriptData {
  $id: string;
  text: string;
  confidence: number;
  audioDurationSec: number;
  words: string; // JSON stringified array
  wordsCount: number;
  status: string;
  aaiTranscriptId: string;
  sentimentAnalysis: string;
}

export const useTranscript = (videoId: string) => {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [words, setWords] = useState<AAIWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        setLoading(true);
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'transcripts',
          [Query.equal('videoId', videoId)]
        );

        if (response.documents.length === 0) {
          throw new Error('No transcript found for this video');
        }

        const transcriptData = response.documents[0] as unknown as TranscriptData;
        setTranscript(transcriptData);

        // Parse words JSON string
        const parsedWords = JSON.parse(transcriptData.words) as AAIWord[];
        setWords(parsedWords);
      } catch (err) {
        console.error('Error fetching transcript:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch transcript');
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchTranscript();
    }
  }, [videoId]);

  return { transcript, words, loading, error };
};