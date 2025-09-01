import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// IDs now sourced from environment variables instead of hardcoded values
export const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const VIDEOS_COLLECTION_ID = "videos";
export const TRANSCRIPT_TABLE_ID = "transcripts";

export const config = {
  databaseId: DATABASE_ID,
  videosCollectionId: VIDEOS_COLLECTION_ID,
  storageBucketId: BUCKET_ID,
};

export { ID };


