// app/dashboard/layout.js
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import DashboardLayoutClient from '@/components/DashboardLayoutClient';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Jika tidak ada user, redirect ke login
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  );
}