import type { Metadata } from 'next';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { getCurrentUserId } from '@/lib/auth/auth-helper';

export const metadata: Metadata = {
  title: 'EventEase — AI Event Planning Assistant',
  description: 'Smart context-aware organizer for weddings, birthdays, and community events with deterministic budget tracking and Plan Stress Test.',
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();

  return (
    <div className="min-h-full bg-[#F8FAFC] text-[#0F172A] flex flex-row">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AppHeader userEmail={userId} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
