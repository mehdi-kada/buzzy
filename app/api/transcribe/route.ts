export async function POST(request: Request) {
    try {
        const { audioUrl } = await request.json();
        console.log("audioUrl:", audioUrl);

        if (!audioUrl) {
            return new Response("Missing audio URL", { status: 400 });
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
                punctuate: true,
                format_text: true,
                language_detection: true,
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
        
        const result = {
            id: transcript.id,
            status: transcript.status,
            text: transcript.text,
            confidence: transcript.confidence,
            audio_duration: transcript.audio_duration,
            words: transcript.words,
            language_code: transcript.language_code
        };
        
        return new Response(JSON.stringify(result), { status: 200 });

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