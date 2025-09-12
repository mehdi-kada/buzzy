import { Client, Databases, Storage, Messaging } from 'node-appwrite';

export async function initializeAppwrite(req) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY || req.headers['x-appwrite-key'] || '');

  const databases = new Databases(client);
  const storage = new Storage(client);
  const messaging = new Messaging(client);
  
  const config = {
    DATABASE_ID: process.env.APPWRITE_FUNCTION_DATABASE_ID,
    VIDEOS_COLLECTION_ID: process.env.APPWRITE_FUNCTION_VIDEOS_COLLECTION_ID,
    TRANSCRIPTS_COLLECTION_ID: process.env.APPWRITE_FUNCTION_TRANSCRIPTS_COLLECTION_ID,
    CLIPS_COLLECTION_ID: process.env.APPWRITE_FUNCTION_CLIPS_COLLECTION_ID,
    VIDEOS_BUCKET_ID: process.env.APPWRITE_FUNCTION_VIDEOS_BUCKET_ID,
    CLIPS_BUCKET_ID: process.env.APPWRITE_FUNCTION_CLIPS_BUCKET_ID,
    THUMBNAILS_BUCKET_ID: process.env.APPWRITE_FUNCTION_THUMBNAILS_BUCKET_ID,
    APPWRITE_TRANSCRIPT_BUCKET_ID: process.env.APPWRITE_FUNCTION_TRANSCRIPT_BUCKET_ID
  };
  
  return { databases, storage, messaging, config };
}