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
          <div className="min-h-screen bg-gray-100">
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
