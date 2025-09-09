import { Client, Databases, Query } from 'node-appwrite';
import { DATABASE_ID, VIDEOS_COLLECTION_ID } from '@/lib/appwrite';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Validate pagination parameters
    if (page < 1) {
      return new Response(JSON.stringify({ error: 'Page must be greater than 0' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    if (limit < 1 || limit > 100) {
      return new Response(JSON.stringify({ error: 'Limit must be between 1 and 100' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Calculate offset for Appwrite pagination
    const offset = (page - 1) * limit;
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);
    
    // Get paginated projects for the user
    const response = await databases.listDocuments(
      DATABASE_ID,
      VIDEOS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc("$createdAt")
      ]
    );

    
    // Map projects to include processing status
    const projectsWithStatus = response.documents.map(doc => ({
      ...doc,
      // Use actual database status field, with fallback logic
      status: doc.status ,
    }));
    
    // Return projects with total count for pagination
    return new Response(JSON.stringify({
      projects: projectsWithStatus,
      total: response.total
    }), {
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