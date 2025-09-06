import { Client, Databases, ID } from 'node-appwrite';
import { DATABASE_ID, TRANSCRIPT_TABLE_ID } from '@/lib/appwrite';
import {
    pollTranscript,
    prepareTranscriptPayload,
    storeTranscriptInDatabase,
    formatErrorResponse,
    openRouterAnalysis,
    createTranscript,
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
        const {transcriptData, srtUrl} = await createTranscript(audioUrl, apiKey);

        // Poll for completion
        //const transcript = await pollTranscript(transcriptData.id, apiKey);

        // Analyze sentiment data with OpenRouter
        let clipsTimestamps = "";
        try {
            if (transcriptData.sentiment_analysis_results && transcriptData.sentiment_analysis_results.length > 0) {
                console.log("Analyzing sentiment data with OpenRouter...");
                clipsTimestamps = await openRouterAnalysis(transcriptData.sentiment_analysis_results);
                console.log("OpenRouter analysis completed");
            }
        } catch (openRouterError) {
            console.error("OpenRouter analysis error:", openRouterError);
            // Continue with empty clipsTimestamps if OpenRouter fails
        }

        // Store in database
        let storedTranscript: any | null = null;
        try {
            const payload = prepareTranscriptPayload(transcriptData, videoId, userId, clipsTimestamps, srtUrl);
            storedTranscript = await storeTranscriptInDatabase(payload);
        } catch (dbError) {
            console.error("Database storage error:", dbError);
        }

        

        const result = {
            id: transcriptData.id,
            status: transcriptData.status,
            text: transcriptData.text,
            confidence: transcriptData.confidence,
            audio_duration: transcriptData.audio_duration,
            words: transcriptData.words,
            language_code: transcriptData.language_code,
            transcriptId: storedTranscript?.$id,
            wordsCount: transcriptData.words?.length || 0,
            clipsTimestamps: clipsTimestamps,
            storageWarning: storedTranscript ? undefined : 'Transcript processed successfully but database storage failed'
        };

        return new Response(JSON.stringify(result), { status: 200 });

    } catch (error) {
        console.error("Transcription error:", error);
        return formatErrorResponse(error);
    }
}