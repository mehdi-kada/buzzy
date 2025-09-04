import { Client, Databases, ID } from 'node-appwrite';
import { DATABASE_ID, TRANSCRIPT_TABLE_ID } from '@/lib/appwrite';
import { GoogleGenAI } from "@google/genai";
import { transcriptAnalysisPrompts } from '../constants';

// Helper to create a transcript request with AssemblyAI
export async function createTranscript(audioUrl: string, apiKey: string) {
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            audio_url: audioUrl,
            auto_highlights: true,
            language_detection: true,
            sentiment_analysis: true,
            speaker_labels: true,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to create transcript: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

// Helper to poll for transcript completion with timeout
export async function pollTranscript(transcriptId: string, apiKey: string, maxPolls: number = 60) {
    let transcript: any;
    let pollCount = 0;

    while (pollCount < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to poll transcript: ${response.status} ${response.statusText}`);
        }

        transcript = await response.json();
        console.log("Transcript status:", transcript.status);

        if (transcript.status === 'completed' || transcript.status === 'error') {
            break;
        }

        pollCount++;
    }

    if (pollCount >= maxPolls) {
        throw new Error("Transcription timeout - please try again");
    }

    if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
    }

    return transcript;
}

// Helper to prepare the database payload
export function prepareTranscriptPayload(transcript: any, videoId: string, userId: string, clipsTimestamps?: string) {
    return {
        videoId,
        userId,
        aaiTranscriptId: transcript.id,
        status: transcript.status,
        text: transcript.text ?? "",
        confidence: transcript.confidence ?? 0,
        audioDurationSec: transcript.audio_duration ?? 0,
        words: JSON.stringify(transcript.words || []),
        wordsCount: transcript.words?.length || 0,
        languageCode: transcript.language_code || 'unknown',
        sentimentAnalysis: JSON.stringify(transcript.sentiment_analysis_results || []),
        clipsTimestamps: clipsTimestamps ?? "",
    };
}

// Helper to store transcript in Appwrite database
export async function storeTranscriptInDatabase(payload: any) {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!); // server key

    const databases = new Databases(client);
    const storedTranscript = await databases.createDocument(
        DATABASE_ID,
        TRANSCRIPT_TABLE_ID,
        ID.unique(),
        payload
    );

    console.log("Stored transcript with ID:", storedTranscript.$id);
    return storedTranscript;
}

// Helper to format error responses
export function formatErrorResponse(error: any) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = (error as any)?.code || "UNKNOWN";

    return new Response(JSON.stringify({
        error: errorMessage,
        code: errorCode,
        details: "Failed to connect to AssemblyAI service"
    }), {
        status: 500,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}


export async function geminiAnalysis(sentimentAnalysisResults: any[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY!;
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: transcriptAnalysisPrompts(JSON.stringify(sentimentAnalysisResults)),
        config: {
            responseMimeType: "application/json"
        }
    });

    return response.text || "";
}