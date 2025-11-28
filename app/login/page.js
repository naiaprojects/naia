// app/login/page.js
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import LoginForm from '@/components/login-form';

export default async function Login() {
  // Jika user sudah login, redirect ke dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}