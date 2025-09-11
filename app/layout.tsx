import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Navigation from "@/components/Navigation";


export const metadata: Metadata = {
  title: 'Buzzler',
  description: 'AI-powered video clip extraction',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-950 dark:to-gray-900">
          <Navigation />
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
          </div>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
