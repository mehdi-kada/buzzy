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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-sm text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent mb-4">Authentication Successful!</h1>
        <p className="text-amber-900/80 dark:text-amber-200/80">Verifying session and redirecting...</p>
      </div>
    </div>
  );
}