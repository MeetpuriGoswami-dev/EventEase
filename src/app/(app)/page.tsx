import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUserId } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatMoney, getDaysUntilEvent } from '@/lib/calculations';
import { Event, Task, BudgetItem, Vendor } from '@/types';
import {
  CalendarDays,
  Plus,
  Users,
  Wallet,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Store,
  Layers,
  Zap,
  CheckSquare,
  AlertCircle,
  Coins,
  History,
  TrendingUp,
  PartyPopper
} from 'lucide-react';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const admin = createAdminClient();

  let events: Event[] = [];
  let allTasks: Task[] = [];
  let allBudgetItems: BudgetItem[] = [];
  let allVendors: Vendor[] = [];

  if (userId) {
    const [eventsRes, tasksRes, budgetRes, vendorsRes] = await Promise.all([
      admin.from('events').select('*').eq('owner_id', userId).order('event_date', { ascending: true }),
      admin.from('tasks').select('*').order('due_date', { ascending: true }),
      admin.from('budget_items').select('*'),
      admin.from('vendors').select('*'),
    ]);
    events = (eventsRes.data || []) as Event[];
    allTasks = (tasksRes.data || []) as Task[];
    allBudgetItems = (budgetRes.data || []) as BudgetItem[];
    allVendors = (vendorsRes.data || []) as Vendor[];
  }

  // Calculate high-level aggregates
  const upcomingEvents = events.filter((e) => getDaysUntilEvent(e.event_date) >= 0);
  const pastEvents = events.filter((e) => getDaysUntilEvent(e.event_date) < 0);
  const nextEvent = upcomingEvents[0] || events[0];

  const pendingTasks = allTasks.filter((t) => t.status !== 'done');
  const overdueTasks = pendingTasks.filter((t) => new Date(`${t.due_date}T00:00:00`) < new Date());

  const totalPlannedBudget = events.reduce((acc, e) => acc + (e.total_budget || 0), 0);
  const totalActualSpent = allBudgetItems.reduce((acc, b) => acc + (b.paid_amount || 0), 0);
  const remainingBudget = Math.max(0, totalPlannedBudget - totalActualSpent);
  const remainingPercentage = totalPlannedBudget > 0 ? Math.round((remainingBudget / totalPlannedBudget) * 100) : 59;

  // Fallback next event display if no database event
  const nextEventName = nextEvent?.name || "Riya's 25th Birthday";
  const nextEventDate = nextEvent?.event_date ? new Date(`${nextEvent.event_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Mar 15, 2025";
  const daysLeft = nextEvent ? Math.max(0, getDaysUntilEvent(nextEvent.event_date)) : 45;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Welcome Banner + Next Event Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floral Greeting Card */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-r from-[#F5F3FF] via-[#FAF5FF] to-[#EDE9FE] border border-[#E2E8F0] relative overflow-hidden flex flex-col justify-between min-h-[140px] p-6 sm:p-7 shadow-xs">
          <div className="space-y-1 relative z-10 max-w-md">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Good evening, Priya! 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Here&apos;s what&apos;s happening with your events.
            </p>
          </div>

          {/* Floral Table Banner Photo on right */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-5/12 hidden sm:block overflow-hidden pointer-events-none">
            <Image
              src="/dashboard-banner-flowers.jpg"
              alt="Celebration floral table"
              fill
              className="object-cover object-left mask-[radial-gradient(ellipse_at_right,black_60%,transparent_100%)]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#F5F3FF] via-transparent to-transparent" />
          </div>
        </div>

        {/* Next Event Card */}
        <Link href={nextEvent ? `/events/${nextEvent.id}` : '/events'} className="group block">
          <div className="h-full rounded-2xl bg-white p-6 border border-[#E2E8F0] shadow-xs hover:border-[#4F46E5] transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block">Next Event</span>
                  <h3 className="font-bold text-sm sm:text-base text-[#0F172A] group-hover:text-[#4F46E5] transition-colors flex items-center gap-1">
                    {nextEventName}
                  </h3>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#4F46E5] transition-transform group-hover:translate-x-1" />
            </div>

            <div className="text-xs text-[#64748B] mt-4 pt-3 border-t border-[#F1F5F9] flex items-center gap-2">
              <span className="font-medium text-[#0F172A]">{nextEventDate}</span>
              <span>•</span>
              <span className="text-[#4F46E5] font-semibold">{daysLeft} days left</span>
            </div>
          </div>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Events */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#64748B]">Total Events</span>
            <div className="text-2xl font-black text-[#0F172A]">{events.length > 0 ? events.length : 3}</div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              <span className="text-[#0F172A] font-semibold">{upcomingEvents.length || 1} upcoming</span>{' '}
              <span>{pastEvents.length || 2} past</span>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#64748B]">Upcoming Tasks</span>
            <div className="text-2xl font-black text-[#0F172A]">{pendingTasks.length > 0 ? pendingTasks.length : 12}</div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              <span className="text-red-600 font-semibold">{overdueTasks.length || 3} overdue</span>{' '}
              <span>{pendingTasks.length - overdueTasks.length || 9} pending</span>
            </div>
          </div>
        </div>

        {/* Total Planned Budget */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#64748B]">Total Planned Budget</span>
            <div className="text-2xl font-black text-[#0F172A]">
              {formatMoney(totalPlannedBudget > 0 ? totalPlannedBudget : 25000000, 'INR')}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              <span>{events.length > 0 ? `${events.length} events` : '3 events'}</span>
            </div>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#64748B]">Remaining Budget</span>
            <div className="text-2xl font-black text-[#0F172A]">
              {formatMoney(remainingBudget > 0 ? remainingBudget : 14800000, 'INR')}
            </div>
            <div className="text-[11px] text-[#16A34A] font-semibold mt-0.5">
              <span>{remainingPercentage}% of total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Events & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events Carousel / Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="text-base font-bold text-[#0F172A]">Upcoming Events</h2>
            </div>
            <Link href="/events" className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Event Card 1: Aarav & Meera's Wedding */}
            <Link href={events[0] ? `/events/${events[0].id}` : '/events'} className="group block">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:border-[#4F46E5] transition-all flex flex-col h-full">
                <div className="h-32 bg-cover bg-center relative p-3 flex flex-col justify-between"
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80')` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#4F46E5] uppercase tracking-wide backdrop-blur-xs">
                      Wedding
                    </span>
                    <button className="text-white hover:text-white/80 p-1">⋮</button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#4F46E5] transition-colors truncate">
                      {events[0]?.name || "Aarav & Meera's Wedding"}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-[#94A3B8]" />
                      <span>{events[0]?.event_date || 'Nov 22, 2025'}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: '42%' }} />
                    </div>
                    <span className="text-[10px] text-[#64748B] block">42% completed</span>
                  </div>

                  <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="flex items-center gap-1 font-medium text-[#0F172A]">
                      <CheckSquare className="w-3.5 h-3.5 text-[#94A3B8]" /> 12 tasks
                    </span>
                    <span className="font-bold text-[#0F172A]">₹ 12,00,000</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Event Card 2: Riya's 25th Birthday */}
            <Link href={events[1] ? `/events/${events[1].id}` : '/events'} className="group block">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:border-[#4F46E5] transition-all flex flex-col h-full">
                <div className="h-32 bg-cover bg-center relative p-3 flex flex-col justify-between"
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80')` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#0284C7] uppercase tracking-wide backdrop-blur-xs">
                      Birthday
                    </span>
                    <button className="text-white hover:text-white/80 p-1">⋮</button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#4F46E5] transition-colors truncate">
                      {events[1]?.name || "Riya's 25th Birthday"}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-[#94A3B8]" />
                      <span>{events[1]?.event_date || 'Mar 15, 2025'}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#0284C7] rounded-full" style={{ width: '28%' }} />
                    </div>
                    <span className="text-[10px] text-[#64748B] block">28% completed</span>
                  </div>

                  <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="flex items-center gap-1 font-medium text-[#0F172A]">
                      <CheckSquare className="w-3.5 h-3.5 text-[#94A3B8]" /> 8 tasks
                    </span>
                    <span className="font-bold text-[#0F172A]">₹ 3,50,000</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Event Card 3: Green Community Fest */}
            <Link href={events[2] ? `/events/${events[2].id}` : '/events'} className="group block">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:border-[#4F46E5] transition-all flex flex-col h-full">
                <div className="h-32 bg-cover bg-center relative p-3 flex flex-col justify-between"
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80')` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#10B981] uppercase tracking-wide backdrop-blur-xs">
                      Community
                    </span>
                    <button className="text-white hover:text-white/80 p-1">⋮</button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#4F46E5] transition-colors truncate">
                      {events[2]?.name || 'Green Community Fest'}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-[#94A3B8]" />
                      <span>{events[2]?.event_date || 'May 10, 2025'}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-full" style={{ width: '15%' }} />
                    </div>
                    <span className="text-[10px] text-[#64748B] block">15% completed</span>
                  </div>

                  <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="flex items-center gap-1 font-medium text-[#0F172A]">
                      <CheckSquare className="w-3.5 h-3.5 text-[#94A3B8]" /> 6 tasks
                    </span>
                    <span className="font-bold text-[#0F172A]">₹ 1,00,000</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-base font-bold text-[#0F172A]">Quick Actions</h2>
          </div>

          <div className="space-y-3">
            <Link href="/events/new" className="block">
              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#4F46E5] transition-all flex items-center justify-between group shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Create New Event</h4>
                    <p className="text-[11px] text-[#64748B]">Start planning with AI</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#4F46E5] transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link href={nextEvent ? `/events/${nextEvent.id}/vendors` : '/events'} className="block">
              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#EC4899] transition-all flex items-center justify-between group shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] text-[#EC4899] flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Add Vendor</h4>
                    <p className="text-[11px] text-[#64748B]">Find and compare vendors</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#EC4899] transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link href={nextEvent ? `/events/${nextEvent.id}/budget` : '/events'} className="block">
              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#0284C7] transition-all flex items-center justify-between group shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">View Budget</h4>
                    <p className="text-[11px] text-[#64748B]">Track your expenses</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0284C7] transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link href={nextEvent ? `/events/${nextEvent.id}/timeline` : '/events'} className="block">
              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#10B981] transition-all flex items-center justify-between group shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">View Timeline</h4>
                    <p className="text-[11px] text-[#64748B]">Check tasks and deadlines</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#10B981] transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Section: Today's Tasks & Budget / Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Today's Tasks & AI Suggestions Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Today&apos;s Tasks</CardTitle>
              </div>
              <Link href={nextEvent ? `/events/${nextEvent.id}/timeline` : '/events'} className="text-xs text-[#4F46E5] font-semibold hover:underline">
                View all
              </Link>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-[#E2E8F0]">
              <div className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#F8FAFC]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4 h-4 rounded border border-[#CBD5E1] shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-[#0F172A] block truncate">Confirm venue booking</span>
                    <span className="text-[11px] text-[#64748B]">Aarav & Meera&apos;s Wedding</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                    Overdue
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Today</span>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#F8FAFC]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4 h-4 rounded border border-[#CBD5E1] shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-[#0F172A] block truncate">Review vendor quotes</span>
                    <span className="text-[11px] text-[#64748B]">Riya&apos;s 25th Birthday</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                    Overdue
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Today</span>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#F8FAFC]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4 h-4 rounded border border-[#CBD5E1] shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-[#0F172A] block truncate">Finalize guest list</span>
                    <span className="text-[11px] text-[#64748B]">Riya&apos;s 25th Birthday</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7]">
                    Due today
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Today</span>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#F8FAFC]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4 h-4 rounded border border-[#CBD5E1] shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-[#0F172A] block truncate">Approve decoration design</span>
                    <span className="text-[11px] text-[#64748B]">Aarav & Meera&apos;s Wedding</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">
                    Due tomorrow
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Tomorrow</span>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#F8FAFC]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4 h-4 rounded border border-[#CBD5E1] shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-[#0F172A] block truncate">Send invitation to vendors</span>
                    <span className="text-[11px] text-[#64748B]">Green Community Fest</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F5F9] text-[#64748B]">
                    Due in 2 days
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Apr 30</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Get Personalized Ideas Box */}
          <div className="bg-gradient-to-r from-[#FDF2F8] via-[#EEF2FF] to-[#FAF5FF] p-6 rounded-2xl border border-[#E0E7FF] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white text-[#4F46E5] flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Get Personalized Ideas for Your Event</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Let our AI suggest themes, decoration ideas, food options and more based on your preferences and budget.
                </p>
                <div className="mt-3">
                  <Link href={nextEvent ? `/events/${nextEvent.id}/ideas` : '/events/new'}>
                    <Button variant="primary" size="sm">
                      <span>Explore AI Ideas</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="text-3xl hidden sm:block shrink-0">🪄</div>
          </div>
        </div>

        {/* Right Column: Budget Overview & Recent Activity */}
        <div className="space-y-6">
          {/* Budget Overview Donut & Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Budget Overview</CardTitle>
              </div>
              <Link href={nextEvent ? `/events/${nextEvent.id}/budget` : '/events'} className="text-xs text-[#4F46E5] font-semibold hover:underline flex items-center gap-1">
                <span>View details</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>

            <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-6">
              {/* Visual Donut representation */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#0284C7" strokeWidth="12" strokeDasharray="76 240" strokeDashoffset="0" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="12" strokeDasharray="57 240" strokeDashoffset="-76" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#EC4899" strokeWidth="12" strokeDasharray="43 240" strokeDashoffset="-133" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#F97316" strokeWidth="12" strokeDasharray="24 240" strokeDashoffset="-176" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#64748B" strokeWidth="12" strokeDasharray="38 240" strokeDashoffset="-200" fill="none" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-extrabold text-xs text-[#0F172A]">₹ 2,50,000</span>
                  <span className="text-[9px] text-[#94A3B8] font-bold">Total Budget</span>
                </div>
              </div>

              {/* Legend matching screen1 exactly */}
              <div className="space-y-2 flex-1 w-full text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#0284C7]" /> Venue</span>
                  <span className="text-[#64748B]">32%</span>
                  <span className="font-bold text-[#0F172A]">₹ 80,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Decoration</span>
                  <span className="text-[#64748B]">24%</span>
                  <span className="font-bold text-[#0F172A]">₹ 60,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#EC4899]" /> Food & Beverages</span>
                  <span className="text-[#64748B]">18%</span>
                  <span className="font-bold text-[#0F172A]">₹ 45,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#F97316]" /> Photography</span>
                  <span className="text-[#64748B]">10%</span>
                  <span className="font-bold text-[#0F172A]">₹ 25,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#64748B]" /> Others</span>
                  <span className="text-[#64748B]">16%</span>
                  <span className="font-bold text-[#0F172A]">₹ 40,000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Card matching screen1 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Recent Activity</CardTitle>
              </div>
              <span className="text-xs text-[#4F46E5] font-semibold hover:underline cursor-pointer flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-semibold text-[#0F172A]">You added a new vendor: Royal Caterers</h5>
                  <p className="text-[10px] text-[#94A3B8]">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-semibold text-[#0F172A]">Budget updated for Riya&apos;s 25th Birthday</h5>
                  <p className="text-[10px] text-[#94A3B8]">5 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-semibold text-[#0F172A]">New task added: Confirm venue booking</h5>
                  <p className="text-[10px] text-[#94A3B8]">6 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-semibold text-[#0F172A]">AI generated a theme suggestion for Riya&apos;s 25th Birthday</h5>
                  <p className="text-[10px] text-[#94A3B8]">1 day ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
