import { notFound, redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';
import { EventHeaderTabs } from '@/components/events/EventHeaderTabs';
import { Event } from '@/types';

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  if (event.owner_id !== userId) {
    redirect('/');
  }

  const typedEvent = event as Event;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <EventHeaderTabs event={typedEvent} />
      {children}
    </div>
  );
}
