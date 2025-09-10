'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { account } from '@/lib/appwrite';
import { ID, Models, OAuthProvider } from 'appwrite';
import { AuthContextType } from '@/interfaces/authContextInterface';

type LoginResult = { success: boolean; error?: string };


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const u = await account.get();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      await account.createEmailPasswordSession(email, password);
      const u = await account.get();
      setUser(u);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string, name: string): Promise<LoginResult> => {
    try {
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      const u = await account.get();
      setUser(u);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async (): Promise<LoginResult> => {
    try {
      await account.deleteSession('current');
      setUser(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email: string): Promise<LoginResult> => {
    try {
      await account.createRecovery(email, `${window.location.origin}/reset-password`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = () => {
    const origin = window.location.origin;
    return account.createOAuth2Session(
      OAuthProvider.Google,
      `${origin}/auth/oauth/success`,
      `${origin}/auth/oauth/failure`,
      ['email', 'profile', 'openid'],
    );
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, resetPassword, checkAuth, loginWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
