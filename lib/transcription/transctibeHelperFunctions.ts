import { Client, Databases, ID } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const TRANSCRIPTS_COLLECTION_ID = 'transcripts';

export async function storeTranscript(transcriptData: any, videoId: string, userId: string) {
    const transcriptDoc = {
        text: transcriptData.text,
        confidence: transcriptData.confidence,
        languageCode: transcriptData.language_code,
        audioDurationSec: transcriptData.audio_duration,
        userId: userId,
        videoId: videoId,
        wordsCount: transcriptData.words?.length || 0,
        status: transcriptData.status,
        aaiTranscriptId: transcriptData.id,
        words: JSON.stringify(transcriptData.words || []),
        sentimentAnalysis: JSON.stringify(transcriptData.sentiment_analysis_results || [])
    };

    const transcript = await databases.createDocument(
        DATABASE_ID,
        TRANSCRIPTS_COLLECTION_ID,
        ID.unique(),
        transcriptDoc
    );

    return transcript;
}