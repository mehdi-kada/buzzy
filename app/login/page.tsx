  'use server';
  
import { getLoggedInUser } from '@/lib/server/appwrite';
import { redirect } from 'next/navigation';
import { ID } from 'node-appwrite';
import { createAdminClient } from '@/lib/server/appwrite';
import { cookies } from 'next/headers';

async function loginWithEmail(formData: FormData) {


  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { account } = await createAdminClient();
  const session = await account.createEmailPasswordSession(email, password);

  const cookiesStore = await cookies();
  cookiesStore.set('appwrite-session', session.secret, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
  });

  redirect('/dashboard');
}

export default async function LoginPage() {
  const user = await getLoggedInUser();
  if (user) redirect('/dashboard');

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

      <form action={loginWithEmail} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            minLength={8}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
