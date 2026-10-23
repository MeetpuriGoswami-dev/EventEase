import Link from 'next/link';
import { getCurrentUserId } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EventTypeBadge } from '@/components/ui/Badge';
import { formatMoney, getDaysUntilEvent } from '@/lib/calculations';
import { Event } from '@/types';
import {
  CalendarDays,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default async function MyEventsPage() {
  const userId = await getCurrentUserId();
  const admin = createAdminClient();

  let events: Event[] = [];
  if (userId) {
    const { data } = await admin
      .from('events')
      .select('*')
      .eq('owner_id', userId)
      .order('event_date', { ascending: true });
    events = (data || []) as Event[];
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">My Events</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage your active celebrations, wedding functions, and community gatherings.
          </p>
        </div>

        <Link href="/events/new">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create with AI</span>
          </Button>
        </Link>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="space-y-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#0F172A]">No events found</h3>
            <p className="text-xs text-[#64748B]">
              You haven&apos;t created any events yet. Let our AI planner draft your first roadmap in seconds.
            </p>
            <div className="pt-2">
              <Link href="/events/new">
                <Button variant="primary" size="sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  <span>Start AI Planning</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => {
            const daysRemaining = getDaysUntilEvent(event.event_date);
            const isPast = daysRemaining < 0;

            const coverImage = event.event_type === 'wedding'
              ? 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'
              : event.event_type === 'birthday'
              ? 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80'
              : 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80';

            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover:border-[#4F46E5] hover:shadow-md transition-all h-full flex flex-col justify-between group overflow-hidden cursor-pointer">
                  <div>
                    <div
                      className="h-32 w-full bg-cover bg-center p-3 flex items-start justify-between"
                      style={{ backgroundImage: `url(${coverImage})` }}
                    >
                      <EventTypeBadge type={event.event_type} />
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isPast ? 'bg-gray-100 text-gray-700' : 'bg-white/90 text-[#4F46E5] backdrop-blur-xs'
                      }`}>
                        {isPast ? 'Past Event' : `${daysRemaining} days left`}
                      </span>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-base text-[#0F172A] group-hover:text-[#4F46E5] transition-colors truncate">
                          {event.name}
                        </h3>
                        <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                          <CalendarDays className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>{event.event_date}</span>
                          {event.city && (
                            <>
                              <span>•</span>
                              <span>{event.city}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0] text-xs">
                        <div>
                          <span className="text-[10px] text-[#94A3B8] font-semibold block">Total Budget</span>
                          <span className="font-bold text-[#0F172A]">
                            {formatMoney(event.total_budget, event.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#94A3B8] font-semibold block">Guest Count</span>
                          <span className="font-bold text-[#0F172A]">
                            {event.guest_count ? `${event.guest_count} guests` : 'Flexible'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#4F46E5] group-hover:bg-[#EEF2FF] transition-colors">
                    <span>Open Event Plan</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
