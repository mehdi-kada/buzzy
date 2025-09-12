'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { logout } = useAuth();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const result = await logout();
      if (!result.success) {
        // Handle logout failure silently or show user-friendly message
      }
      router.push('/auth/login');
    } catch (error) {
      // Handle logout error silently or show user-friendly message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Logout"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-amber-700 dark:text-gray-300 dark:hover:text-amber-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md px-2 py-1 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {isLoading ? 'Signing out…' : 'Logout'}
    </button>
  );
}
