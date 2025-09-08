import { Client, Databases, ID } from 'node-appwrite';
import { DATABASE_ID, TRANSCRIPT_TABLE_ID, VIDEOS_COLLECTION_ID } from '@/lib/appwrite';
import {
    prepareTranscriptPayload,
    storeTranscriptInDatabase,
    formatErrorResponse,
    openRouterAnalysis,
    createTranscript,
} from '@/lib/transcription/helperFunctions';
import type { TranscribeRequest, TranscribeResponse, APIErrorResponse } from '@/types';

export async function POST(request: Request): Promise<Response> {
    try {
        const body: TranscribeRequest = await request.json();
        const { audioUrl, videoId, userId } = body;
        
        console.log("audioUrl:", audioUrl, "videoId:", videoId, "userId:", userId);

        if (!audioUrl || !videoId || !userId) {
            const error: APIErrorResponse = {
                error: "Missing required parameters",
                details: "audioUrl, videoId, and userId are required"
            };
            return new Response(JSON.stringify(error), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            const error: APIErrorResponse = {
                error: "Server configuration error",
                details: "AssemblyAI API key not configured"
            };
            return new Response(JSON.stringify(error), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create transcript
        const {transcriptData, srtUrl} = await createTranscript(audioUrl, apiKey);

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

        // Store in transcripts table
        let storedTranscript: any | null = null;
        try {
            const payload = prepareTranscriptPayload(transcriptData, videoId, userId, clipsTimestamps, srtUrl);
            storedTranscript = await storeTranscriptInDatabase(payload);
            
            // Update video status to processing after transcript is created
            const client = new Client()
                .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
                .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
                .setKey(process.env.APPWRITE_API_KEY!);
            
            const databases = new Databases(client);
            
            await databases.updateDocument(
                DATABASE_ID,
                VIDEOS_COLLECTION_ID,
                videoId,
                {
                    status: 'processing',
                }
            );
        } catch (dbError) {
            console.error("Database storage error:", dbError);
        }

        const result: TranscribeResponse = {
            id: transcriptData.id,
            status: transcriptData.status,
            text: transcriptData.text || '',
            confidence: transcriptData.confidence || 0,
            audio_duration: transcriptData.audio_duration || 0,
            words: transcriptData.words || undefined,
            language_code: transcriptData.language_code || 'en',
            transcriptId: storedTranscript?.$id,
            wordsCount: transcriptData.words?.length || 0,
            clipsTimestamps: clipsTimestamps,
            storageWarning: storedTranscript ? undefined : 'Transcript processed successfully but database storage failed'
        };

        return new Response(JSON.stringify(result), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Transcription error:", error);
        return formatErrorResponse(error);
    }
}