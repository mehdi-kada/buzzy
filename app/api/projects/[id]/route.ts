import { Client, Databases, Query } from 'node-appwrite';
import { DATABASE_ID, VIDEOS_COLLECTION_ID } from '@/lib/appwrite';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
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
    
    // Get the project document
    const project = await databases.getDocument(
      DATABASE_ID,
      VIDEOS_COLLECTION_ID,
      projectId
    );
    
    // Verify that the project belongs to the requesting user
    if (project.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Project not found or access denied' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Return the project with processing status
    const projectWithStatus = {
      ...project,
      // Use actual database status field, with fallback logic
      status: project.status || (project.clipIds && project.clipIds.length > 0 ? 'completed' : 'processing'),
    };
    
    return new Response(JSON.stringify(projectWithStatus), {
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