// app/dashboard/layout.js
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import DashboardNav from '@/components/dashboard-nav';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Jika tidak ada user, redirect ke login
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <DashboardNav user={user} />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}