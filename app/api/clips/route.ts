import { Client, Databases, Query } from 'node-appwrite';
import { DATABASE_ID } from '@/lib/appwrite';

const CLIPS_COLLECTION_ID = 'clips';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const userId = searchParams.get('userId');
    
    if (!videoId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing videoId or userId parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    
    // Get all clips for the video
    const response = await databases.listDocuments(
      DATABASE_ID,
      CLIPS_COLLECTION_ID,
      [
        Query.equal('videoId', videoId),
        Query.equal('userId', userId),
        Query.orderAsc('startTime')
      ]
    );
    
    return new Response(JSON.stringify(response.documents), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error fetching clips:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
