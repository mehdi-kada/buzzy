import type { Metadata } from "next";
import "../globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Navigation from "@/components/Navigation";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
        <Navigation />

          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-950 dark:to-gray-900">
            {children}
          </div>
        <Toaster />
    </>
  );
}
