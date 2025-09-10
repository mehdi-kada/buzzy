import { Client, Storage, ID, Databases } from 'node-appwrite';
import { DATABASE_ID, VIDEOS_COLLECTION_ID, BUCKET_ID } from '@/lib/appwrite';

export async function POST(request: Request) {
  try {
    const { url, userId } = await request.json();
    
    if (!url || !userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: url and userId are required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const storage = new Storage(client);
    const databases = new Databases(client);

    // Download the video from the provided URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Get file name from URL or generate one
    const urlObj = new URL(url);
    const fileName = urlObj.pathname.split('/').pop() || `imported-video-${Date.now()}.mp4`;
    
    // Create a file in Appwrite storage
    const file = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      buffer,
      fileName
    );

    // Create a document in the videos collection
    const videoDoc = await databases.createDocument(
      DATABASE_ID,
      VIDEOS_COLLECTION_ID,
      file.$id,
      {
        title: fileName,
        description: 'Imported video',
        userId: userId,
        status: 'uploaded',
        createdAt: new Date().toISOString(),
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        videoId: file.$id,
        audioUrl: `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Import video error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to import video'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}