import { getLoggedInUser } from '@/lib/server/appwrite';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default async function LoginPage() {
  const user = await getLoggedInUser();
  if (user) redirect('/dashboard');
  return <LoginForm />;
}
