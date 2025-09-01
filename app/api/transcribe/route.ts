import { storeTranscript } from '@/lib/transcription/transctibeHelperFunctions';


export async function POST(request: Request) {
    try {
        const { audioUrl, videoId, userId } = await request.json();
        console.log("audioUrl:", audioUrl, "videoId:", videoId, "userId:", userId);

        if (!audioUrl || !videoId || !userId) {
            return new Response("Missing required parameters: audioUrl, videoId, and userId", { status: 400 });
        }

        const apiKey = process.env.ASSEMBLYAI_API_KEY!;
        
        const createResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
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

        if (!createResponse.ok) {
            throw new Error(`Failed to create transcript: ${createResponse.status} ${createResponse.statusText}`);
        }

        const transcriptData = await createResponse.json();

        // Poll for completion with timeout
        let transcript = transcriptData;
        let pollCount = 0;
        const maxPolls = 60; 
        
        while ((transcript.status === 'queued' || transcript.status === 'processing') && pollCount < maxPolls) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcript.id}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            if (!pollResponse.ok) {
                throw new Error(`Failed to poll transcript: ${pollResponse.status} ${pollResponse.statusText}`);
            }

            transcript = await pollResponse.json();
            console.log("Transcript status:", transcript.status);
            pollCount++;
        }

        if (pollCount >= maxPolls) {
            throw new Error("Transcription timeout - please try again");
        }

        if (transcript.status === 'error') {
            throw new Error(`Transcription failed: ${transcript.error}`);
        }

        console.log("Transcription completed:", transcript.text);
        console.log("Sentiment analysis results:", transcript.sentiment_analysis_results?.length || 0, "items");
        console.log("Auto highlights:", transcript.auto_highlights?.length || 0, "items");
        // Store transcript in database
        try {
            const storedTranscript = await storeTranscript(transcript, videoId, userId);
            
            console.log("Stored transcript with ID:", storedTranscript.$id);
            console.log("Stored", transcript.words?.length || 0, "words as JSON");
            console.log("Stored", transcript.sentiment_analysis_results?.length || 0, "sentiment analysis results as JSON");
            console.log("Stored", transcript.auto_highlights?.length || 0, "auto highlights as JSON");

            const result = {
                id: transcript.id,
                status: transcript.status,
                text: transcript.text,
                confidence: transcript.confidence,
                audio_duration: transcript.audio_duration,
                words: transcript.words,
                language_code: transcript.language_code,
                sentiment_analysis_results: transcript.sentiment_analysis_results,
                // Database information
                transcriptId: storedTranscript.$id,
                wordsCount: transcript.words?.length || 0
            };
            
            return new Response(JSON.stringify(result), { status: 200 });
            
        } catch (dbError) {
            console.error("Database storage error:", dbError);
            
            // Return transcript data even if database storage fails
            const result = {
                id: transcript.id,
                status: transcript.status,
                text: transcript.text,
                confidence: transcript.confidence,
                audio_duration: transcript.audio_duration,
                words: transcript.words,
                language_code: transcript.language_code,
                sentiment_analysis_results: transcript.sentiment_analysis_results,
                warning: "Transcript processed successfully but database storage failed"
            };
            
            return new Response(JSON.stringify(result), { status: 200 });
        }

    } catch (error) {
        console.error("Transcription error:", error);
        
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
}