"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";


export default function OAuthSuccessPage() {
  const router = useRouter();
  const { checkAuth, user, loading } = useAuth();
  const redirectedRef = useRef(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (loading || redirectedRef.current) return;

    if (user) {
      redirectedRef.current = true;
      router.replace('/dashboard');
    } else {
      redirectedRef.current = true;
      router.replace('/auth/login?error=oauth_failed');
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Successful!</h1>
        <p className="text-gray-700">Verifying session and redirecting...</p>
      </div>
    </div>
  );
}