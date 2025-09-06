import { Client, Databases } from 'node-appwrite';
import { DATABASE_ID, TRANSCRIPT_TABLE_ID } from '@/lib/appwrite';

export async function PATCH(request: Request) {
    try {
        const { transcriptId, text } = await request.json();

        if (!transcriptId || !text) {
            return new Response("Missing required parameters: transcriptId and text", { status: 400 });
        }

        // Initialize Appwrite client
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
            .setKey(process.env.APPWRITE_API_KEY!); // server key

        const databases = new Databases(client);

        // Update the transcript document with the new text
        const updatedTranscript = await databases.updateDocument(
            DATABASE_ID,
            TRANSCRIPT_TABLE_ID,
            transcriptId,
            {
                text: text
            }
        );

        return new Response(JSON.stringify({
            success: true,
            message: "Transcript updated successfully",
            transcript: updatedTranscript
        }), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error("Update transcript error:", error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            message: "Failed to update transcript"
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}