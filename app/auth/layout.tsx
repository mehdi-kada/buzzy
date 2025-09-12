import AuthNavBar from '@/components/AuthNavBar';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AuthNavBar />
      <main>
        {children}
      </main>
    </div>
  );
}