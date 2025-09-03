import { Client, Databases, ID } from 'node-appwrite';
import { DATABASE_ID, TRANSCRIPT_TABLE_ID } from '@/lib/appwrite';
import {
    createTranscript,
    pollTranscript,
    prepareTranscriptPayload,
    storeTranscriptInDatabase,
    formatErrorResponse
} from '@/lib/transcription/helperFunctions';

export async function POST(request: Request) {
    try {
        const { audioUrl, videoId, userId } = await request.json();
        console.log("audioUrl:", audioUrl, "videoId:", videoId, "userId:", userId);

        if (!audioUrl || !videoId || !userId) {
            return new Response("Missing required parameters: audioUrl, videoId, and userId", { status: 400 });
        }

        const apiKey = process.env.ASSEMBLYAI_API_KEY!;

        // Create transcript
        const transcriptData = await createTranscript(audioUrl, apiKey);

        // Poll for completion
        const transcript = await pollTranscript(transcriptData.id, apiKey);

        // Store in database
        let storedTranscript: any | null = null;
        try {
            const payload = prepareTranscriptPayload(transcript, videoId, userId);
            storedTranscript = await storeTranscriptInDatabase(payload);
        } catch (dbError) {
            console.error("Database storage error:", dbError);
        }

        

        const result = {
            id: transcript.id,
            status: transcript.status,
            text: transcript.text,
            confidence: transcript.confidence,
            audio_duration: transcript.audio_duration,
            words: transcript.words,
            language_code: transcript.language_code,
            sentiment_analysis_results: transcript.sentiment_analysis_results,
            transcriptId: storedTranscript?.$id,
            wordsCount: transcript.words?.length || 0,
            storageWarning: storedTranscript ? undefined : 'Transcript processed successfully but database storage failed'
        };

        return new Response(JSON.stringify(result), { status: 200 });

    } catch (error) {
        console.error("Transcription error:", error);
        return formatErrorResponse(error);
    }
}