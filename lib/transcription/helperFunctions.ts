import { Client, Databases, ID } from 'node-appwrite';
import { DATABASE_ID, TRANSCRIPT_TABLE_ID } from '@/lib/appwrite';
import { openRouterAnalysisPrompt } from '../constants';
import OpenAI from 'openai';

// Helper to create a transcript request with AssemblyAI
// TODO: Add type for trnascripts
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

export async function openRouterAnalysis(sentimentAnalysisResults: any[]): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set in environment variables");
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://openrouter.ai/api/v1",
    });

    const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3.1:free", // DeepSeek model
        messages: [
            {
                role: "system",
                content: openRouterAnalysisPrompt
            },
            {
                role: "user",
                content: `Analyze this sentiment analysis data and return viral clip timestamps: ${JSON.stringify(sentimentAnalysisResults)}`
            }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
    });

    let content = response.choices[0]?.message?.content || "[]";
    
    // Remove markdown code blocks if they exist
    if (content.startsWith("```json")) {
        content = content.substring(7);
    }
    if (content.startsWith("```")) {
        content = content.substring(3);
    }
    if (content.endsWith("```")) {
        content = content.slice(0, -3);
    }
    
    // Trim whitespace
    content = content.trim();
    
    // Validate that it's valid JSON and extract clips array
    try {
        const parsed = JSON.parse(content);
        
        // If it's already an array, return it
        if (Array.isArray(parsed)) {
            return JSON.stringify(parsed);
        }
        
        // If it's an object with clips array, extract it
        if (parsed.clips && Array.isArray(parsed.clips)) {
            return JSON.stringify(parsed.clips);
        }
        
        // If it's an object but no clips array, try to find any array property
        for (const key in parsed) {
            if (Array.isArray(parsed[key])) {
                return JSON.stringify(parsed[key]);
            }
        }
        
        console.error("No clips array found in response:", content);
        return "[]";
    } catch (e) {
        console.error("Invalid JSON from OpenRouter:", content);
        return "[]";
    }
}