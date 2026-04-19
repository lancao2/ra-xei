import { getUser, logout, getUserBills } from '@/app/actions';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { LogOut, User as UserIcon } from 'lucide-react';

export default async function DashboardPage() {
  const [user, initialBills] = await Promise.all([
    getUser(),
    getUserBills()
  ]);

  if (!user) {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      <DashboardClient user={user} initialBills={initialBills} />
    </main>
  );
}
