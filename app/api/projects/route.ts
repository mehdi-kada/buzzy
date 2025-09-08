import { Client, Databases, Query } from 'node-appwrite';
import { DATABASE_ID, VIDEOS_COLLECTION_ID } from '@/lib/appwrite';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId parameter' }), {
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
    
    // Get all projects for the user
    const response = await databases.listDocuments(
      DATABASE_ID,
      VIDEOS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.limit(25),
        Query.orderDesc("$createdAt")
      ]
    );

    
    // Map projects to include processing status
    const projectsWithStatus = response.documents.map(doc => ({
      ...doc,
      // Use actual database status field, with fallback logic
      status: doc.status ,
    }));
    
    return new Response(JSON.stringify(projectsWithStatus), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}