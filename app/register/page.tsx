import { getLoggedInUser } from '@/lib/server/appwrite';
import { redirect } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';

export default async function SignUpPage() {
  const user = await getLoggedInUser();
  if (user) redirect('/dashboard');
  return <RegisterForm />;
}
