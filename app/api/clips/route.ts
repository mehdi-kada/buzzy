import { Client, Databases, Query } from 'node-appwrite';
import { DATABASE_ID } from '@/lib/appwrite';
import type { Clip, APIErrorResponse } from '@/types';

const CLIPS_COLLECTION_ID = 'clips';

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const userId = searchParams.get('userId');
    
    if (!videoId || !userId) {
      const error: APIErrorResponse = {
        error: 'Missing required parameters',
        details: 'videoId and userId are required'
      };
      return new Response(JSON.stringify(error), {
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
    
    const clips: Clip[] = response.documents as unknown as Clip[];
    
    return new Response(JSON.stringify(clips), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error fetching clips:', error);
    const apiError: APIErrorResponse = {
      error: 'Failed to fetch clips',
      details: error.message
    };
    return new Response(JSON.stringify(apiError), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
