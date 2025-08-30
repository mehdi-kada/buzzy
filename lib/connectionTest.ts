import { account } from '@/lib/appwrite';

export const testAppwriteConnection = async () => {
  try {
    console.log("🔌 Testing Appwrite connection...");
    
    // Test basic connection
    const health = await fetch(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/health`, {
      method: 'GET',
    });
    
    if (health.ok) {
      console.log("✅ Appwrite server is reachable");
    } else {
      console.error("❌ Appwrite server health check failed:", health.status);
    }
    
    // Test authentication
    try {
      const user = await account.get();
      console.log("✅ User session is valid:", user.$id);
      return { connected: true, authenticated: true, user };
    } catch (authError) {
      console.log("⚠️ No valid user session");
      return { connected: true, authenticated: false, user: null };
    }
    
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return { connected: false, authenticated: false, user: null, error };
  }
};
