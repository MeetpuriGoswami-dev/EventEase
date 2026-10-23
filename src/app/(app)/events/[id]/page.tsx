import { notFound, redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';
import { EventOverviewClient } from '@/components/events/EventOverviewClient';
import { Event, Task, BudgetItem, Vendor } from '@/types';

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const admin = createAdminClient();

  const [eventRes, tasksRes, budgetRes, vendorsRes] = await Promise.all([
    admin.from('events').select('*').eq('id', id).single(),
    admin.from('tasks').select('*').eq('event_id', id).order('due_date', { ascending: true }),
    admin.from('budget_items').select('*').eq('event_id', id).order('created_at', { ascending: true }),
    admin.from('vendors').select('*').eq('event_id', id).order('created_at', { ascending: true }),
  ]);

  if (eventRes.error || !eventRes.data) {
    notFound();
  }

  const event = eventRes.data as Event;
  const tasks = (tasksRes.data || []) as Task[];
  const budgetItems = (budgetRes.data || []) as BudgetItem[];
  const vendors = (vendorsRes.data || []) as Vendor[];

  return (
    <EventOverviewClient
      event={event}
      tasks={tasks}
      budgetItems={budgetItems}
      vendors={vendors}
    />
  );
}
