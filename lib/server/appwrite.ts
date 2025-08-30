// This file is no longer used as we've moved to client-side authentication
// Keeping it for reference but it's not actively used in the application

import { Client, Account, Users } from 'node-appwrite';
import { cookies } from 'next/headers';

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get users() {
      return new Users(client);
    },
  };
}

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const cookiesStore = await cookies();
  const session = cookiesStore.get('appwrite-session');

  if (!session || !session.value) {
    throw new Error('No session');
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error) {
    return null;
  }
}
    
export async function logoutUser() {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession('current');
    return { success: true };
  } catch (error) {
    // If session is already invalid, consider it a successful logout
    return { success: true };
  }
}
