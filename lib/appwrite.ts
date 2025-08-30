import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const BUCKET_ID = '68b2ea8d001162d1006d';
export const DATABASE_ID = '68b2d533003210de565e';
export const VIDEOS_COLLECTION_ID = 'videos';

export const config = {
  databaseId: DATABASE_ID,
  videosCollectionId: VIDEOS_COLLECTION_ID,
  storageBucketId: BUCKET_ID,
};

export { ID };


