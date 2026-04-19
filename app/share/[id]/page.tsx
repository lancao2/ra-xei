import { getBill, incrementScanCount } from '@/app/actions';
import ShareClient from './ShareClient';
import { notFound } from 'next/navigation';

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bill = await getBill(id);

  if (!bill) {
    notFound();
  }


  return (
    <main className="min-h-screen p-4 flex items-center justify-center">
      <ShareClient bill={bill} />
    </main>
  );
}
