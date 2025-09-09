import { Client, Databases, Storage } from 'node-appwrite';

export async function initializeAppwrite(req) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY || req.headers['x-appwrite-key'] || '');

  const databases = new Databases(client);
  const storage = new Storage(client);
  
  const config = {
    DATABASE_ID: process.env.APPWRITE_FUNCTION_DATABASE_ID || '68b2d533003210de565e',
    VIDEOS_COLLECTION_ID: process.env.APPWRITE_FUNCTION_VIDEOS_COLLECTION_ID || 'videos',
    TRANSCRIPTS_COLLECTION_ID: process.env.APPWRITE_FUNCTION_TRANSCRIPTS_COLLECTION_ID || 'transcripts',
    CLIPS_COLLECTION_ID: process.env.APPWRITE_FUNCTION_CLIPS_COLLECTION_ID || 'clips',
    // Prefer the Appwrite function env var names, then fall back to other envs used locally.
    VIDEOS_BUCKET_ID: process.env.APPWRITE_FUNCTION_VIDEOS_BUCKET_ID
      || process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID
      || process.env.VIDEOS_BUCKET_ID
      || 'videos',
    CLIPS_BUCKET_ID: process.env.APPWRITE_FUNCTION_CLIPS_BUCKET_ID
      || process.env.CLIPS_BUCKET_ID
      || 'clips',
    // Use the function-specific var first. Do not silently assume a friendly slug exists in cloud.
    THUMBNAILS_BUCKET_ID: process.env.APPWRITE_FUNCTION_THUMBNAILS_BUCKET_ID
      || process.env.THUMBNAILS_BUCKET_ID
      || process.env.NEXT_PUBLIC_APPWRITE_THUMBNAILS_BUCKET_ID
      || 'thumbnails',
    APPWRITE_TRANSCRIPT_BUCKET_ID: process.env.APPWRITE_FUNCTION_TRANSCRIPT_BUCKET_ID || process.env.APPWRITE_TRANSCRIPT_BUCKET_ID || ''
  };
  
  return { databases, storage, config };
}
