import { getUser } from '@/app/actions';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';

export default async function Home() {
  const user = await getUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#050505]">
      <AuthForm />
    </main>
  );
}
