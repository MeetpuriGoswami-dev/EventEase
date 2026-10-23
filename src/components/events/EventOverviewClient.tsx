'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Event,
  Task,
  BudgetItem,
  Vendor,
  PlanDraft,
} from '@/types';
import {
  calculateBudgetSummary,
  formatMoney,
  getDaysUntilEvent,
} from '@/lib/calculations';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PriorityBadge, TaskStatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  CalendarDays,
  MapPin,
  Users,
  Palette,
  CheckCircle2,
  Clock,
  Wallet,
  Store,
  Sparkles,
  Zap,
  ChevronRight,
  Plus,
  ArrowRight,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface EventOverviewClientProps {
  event: Event;
  tasks: Task[];
  budgetItems: BudgetItem[];
  vendors: Vendor[];
}

export function EventOverviewClient({
  event,
  tasks: initialTasks,
  budgetItems: initialBudget,
  vendors: initialVendors,
}: EventOverviewClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [budgetItems] = useState(initialBudget);
  const [vendors] = useState(initialVendors);

  // AI Generation State
  const [generating, setGenerating] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [draftWarning, setDraftWarning] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currency = event.currency || 'INR';
  const daysRemaining = getDaysUntilEvent(event.event_date);
  const budgetSummary = calculateBudgetSummary(event.total_budget, budgetItems);

  // Task metrics
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const pendingTasks = tasks.filter((t) => t.status !== 'done').slice(0, 5);

  // Group budget items by category for real donut data
  const categoryTotals = budgetItems.reduce<Record<string, number>>((acc, item) => {
    const cat = item.category || 'Others';
    acc[cat] = (acc[cat] || 0) + (item.planned_amount || 0);
    return acc;
  }, {});
  const categoryColors = ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#0284C7', '#94A3B8'];
  const categoryEntries = Object.entries(categoryTotals);
  const totalPlanned = categoryEntries.reduce((s, [, v]) => s + v, 0) || event.total_budget || 1;

  // Task progress breakdown by all categories
  const taskCategories = tasks.reduce<Record<string, { done: number; total: number }>>((acc, t) => {
    const cat = t.category || 'General';
    if (!acc[cat]) acc[cat] = { done: 0, total: 0 };
    acc[cat].total++;
    if (t.status === 'done') acc[cat].done++;
    return acc;
  }, {});
  const taskCategoryEntries = Object.entries(taskCategories);
  const taskCatColors = ['#4F46E5', '#EC4899', '#10B981', '#0284C7', '#F59E0B', '#8B5CF6', '#14B8A6', '#64748B'];

  // Calculate dynamic SVG donut circle segments
  // Circumference for r=38 is 2 * PI * 38 ≈ 238.76
  const CIRCUMFERENCE = 238.76;
  let cumulativeOffset = 0;
  const donutSegments = categoryEntries.map(([cat, amount], i) => {
    const fraction = totalPlanned > 0 ? amount / totalPlanned : 0;
    const strokeLength = fraction * CIRCUMFERENCE;
    const offset = cumulativeOffset;
    cumulativeOffset += strokeLength;
    return {
      cat,
      color: categoryColors[i % categoryColors.length],
      strokeDasharray: `${strokeLength.toFixed(2)} ${(CIRCUMFERENCE - strokeLength).toFixed(2)}`,
      strokeDashoffset: (-offset).toFixed(2),
    };
  });


  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus as any } : t))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setDraftWarning(null);
    try {
      const res = await fetch(`/api/events/${event.id}/generate-plan`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Plan generation failed');

      setDraft(data.draft);
      if (data.warning) setDraftWarning(data.warning);
      setDraftModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Plan generation failed';
      alert(`Could not generate plan: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    setSavingDraft(true);
    try {
      const res = await fetch(`/api/events/${event.id}/save-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan');

      setDraftModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save plan';
      alert(msg);
    } finally {
      setSavingDraft(false);
    }
  };

  const shareableText = `📋 Event Plan Summary: ${event.name}
📅 Date: ${event.event_date} (${daysRemaining >= 0 ? `${daysRemaining} days remaining` : 'Past event'})
📍 Location: ${event.city || 'TBD'}
👥 Expected Guests: ${event.guest_count || 'Flexible'}
💰 Total Budget: ${formatMoney(event.total_budget, currency)}
📊 Projected Spend: ${formatMoney(budgetSummary.projectedTotal, currency)} (${budgetSummary.isOverBudget ? '⚠️ Projected Overspend' : '✅ Within Target'})
✅ Tasks Completed: ${completedTasks.length}/${tasks.length} (${taskProgress}%)

Generated via EventEase Planner.`;

  return (
    <div className="space-y-6">
      {/* 2-Column Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Summary 4 Cards */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Event Summary</CardTitle>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShareModalOpen(true)}>
                <Share2 className="w-3.5 h-3.5 mr-1" />
                <span>Share</span>
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-2">
                    <CalendarDays className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-xs text-[#0F172A]">{event.event_date}</div>
                  <span className="text-[10px] text-[#94A3B8]">Event Date</span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-xs text-[#0F172A] truncate">{event.city || 'Jaipur, Rajasthan'}</div>
                  <span className="text-[10px] text-[#94A3B8]">Location</span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="w-7 h-7 rounded-lg bg-[#FDF2F8] text-[#EC4899] flex items-center justify-center mb-2">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-xs text-[#0F172A]">{event.guest_count || 100}</div>
                  <span className="text-[10px] text-[#94A3B8]">Guest Count</span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-2">
                    <Palette className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-xs text-[#0F172A] truncate">
                    {event.preferences?.theme || 'Traditional'}
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">Theme / Style</span>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#0F172A]">Task Completion Progress</span>
                  <span className="text-[#4F46E5] font-bold">{taskProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${taskProgress}%` }} />
                </div>
                {tasks.length === 0 ? (
                  <p className="text-[11px] text-[#94A3B8] pt-1">No tasks yet. Generate a plan to get started.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 text-[11px] text-[#64748B] pt-1">
                    {taskCategoryEntries.map(([cat, { done, total }], i) => (
                      <span key={cat} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: taskCatColors[i] ?? '#94A3B8' }} />
                        {cat} {Math.round((done / total) * 100)}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Budget Overview</CardTitle>
              </div>
              <Link href={`/events/${event.id}/budget`} className="text-xs text-[#4F46E5] font-semibold hover:underline">
                View Details →
              </Link>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Donut Chart with dynamic real SVG slices */}
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                    {donutSegments.length === 0 ? (
                      <circle cx="50" cy="50" r="38" stroke="#E2E8F0" strokeWidth="12" fill="none" />
                    ) : (
                      donutSegments.map((seg) => (
                        <circle
                          key={seg.cat}
                          cx="50"
                          cy="50"
                          r="38"
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          fill="none"
                        />
                      ))
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-extrabold text-sm text-[#0F172A]">
                      {formatMoney(event.total_budget, currency)}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">Total Budget</span>
                  </div>
                </div>

                {/* Categories Table / Legend */}
                <div className="space-y-2 flex-1 w-full text-xs">
                  {categoryEntries.length === 0 ? (
                    <p className="text-[11px] text-[#94A3B8] py-4 text-center">No budget items yet. Add items in the Budget tab.</p>
                  ) : (
                    categoryEntries.map(([cat, amount], i) => {
                      const pct = Math.round((amount / totalPlanned) * 100);
                      return (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[i] ?? '#94A3B8' }} />
                            {cat}
                          </span>
                          <span className="text-[#64748B]">{pct}%</span>
                          <span className="font-bold text-[#0F172A]">{formatMoney(amount, currency)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {budgetItems.length === 0 ? (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#64748B]">
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>No budget items yet. Go to the <strong>Budget</strong> tab to add line items.</span>
                </div>
              ) : budgetSummary.isOverBudget ? (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#DC2626]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-bold">Over budget!</span>
                  <span className="text-[11px] text-[#B91C1C]">
                    {formatMoney(Math.abs(budgetSummary.budgetVariance), currency)} over your total budget.
                  </span>
                </div>
              ) : (
                <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#059669]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-bold">You&apos;re within budget!</span>
                  <span className="text-[11px] text-[#047857]">
                    {formatMoney(Math.max(0, budgetSummary.budgetVariance), currency)} remaining from your total budget.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Upcoming Tasks</CardTitle>
              </div>
              <Link href={`/events/${event.id}/timeline`} className="text-xs text-[#4F46E5] font-semibold hover:underline">
                View All →
              </Link>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-[#E2E8F0]">
              {pendingTasks.map((t) => {
                const isOverdue = new Date(`${t.due_date}T00:00:00`) < new Date();
                return (
                  <div key={t.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#F8FAFC]">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={t.status === 'done'}
                        onChange={() => toggleTaskStatus(t.id, t.status)}
                        className="rounded border-[#CBD5E1] text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-[#0F172A] block truncate">{t.title}</span>
                        <span className="text-[11px] text-[#64748B]">{t.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#94A3B8]">📅 {t.due_date}</span>
                      {isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                          Overdue
                        </span>
                      ) : (
                        <PriorityBadge priority={t.priority} />
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Planning Progress Card */}
          <Card>
            <CardContent className="p-5 text-center space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  taskProgress === 100
                    ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                    : taskProgress > 0
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                }`}>
                  {taskProgress === 100 ? 'Completed' : taskProgress > 0 ? 'In Progress' : 'Not Started'}
                </span>
                <span className="text-xs font-semibold text-[#64748B]">
                  {completedTasks.length} / {tasks.length} tasks
                </span>
              </div>

              {/* Circular Gauge */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="8" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={taskProgress === 100 ? '#10B981' : '#4F46E5'}
                    strokeWidth="8"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (251 * taskProgress) / 100}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-[#0F172A]">{taskProgress}%</span>
                  <span className="text-[10px] text-[#94A3B8]">Tasks Done</span>
                </div>
              </div>

              <div className="text-xs font-bold text-[#0F172A]">Overall Progress</div>
              <p className="text-[11px] text-[#64748B]">
                {tasks.length === 0
                  ? 'No tasks created yet.'
                  : `${completedTasks.length} of ${tasks.length} planned activities completed.`}
              </p>

              <div className="pt-2">
                <Link href={`/events/${event.id}/timeline`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <span>View Event Details</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 space-y-2">
              <Link href={`/events/${event.id}/timeline`} className="block">
                <div className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#4F46E5] transition-all bg-[#F8FAFC] flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">Add Task</h4>
                      <p className="text-[10px] text-[#64748B]">Create a new task for your event</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
              </Link>

              <Link href={`/events/${event.id}/vendors`} className="block">
                <div className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#EC4899] transition-all bg-[#F8FAFC] flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FDF2F8] text-[#EC4899] flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">Add Vendor</h4>
                      <p className="text-[10px] text-[#64748B]">Find and compare quotes</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
              </Link>

              <Link href={`/events/${event.id}/budget`} className="block">
                <div className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#0284C7] transition-all bg-[#F8FAFC] flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">View Budget</h4>
                      <p className="text-[10px] text-[#64748B]">Track your expenses</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
              </Link>

              <Link href={`/events/${event.id}/ideas`} className="block">
                <div className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#F59E0B] transition-all bg-[#F8FAFC] flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">Get AI Suggestions</h4>
                      <p className="text-[10px] text-[#64748B]">Personalized ideas for your event</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
              </Link>

              <Link href={`/events/${event.id}/stress-test`} className="block">
                <div className="p-2.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] hover:border-[#10B981] transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white text-[#10B981] flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#059669]">Plan Stress Test</h4>
                      <p className="text-[10px] text-[#047857]">See how changes affect budget</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Draft Review Modal */}
      <Modal
        isOpen={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
        title="Review AI Plan Draft"
        description="Verify generated tasks and budget allocations before saving."
        maxWidth="xl"
      >
        {draft && (
          <div className="space-y-5">
            <div className="p-3 bg-[#EEF2FF] rounded-xl text-xs text-[#4F46E5] font-medium">
              {draft.summary}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Starter Budget Categories</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {draft.budgetCategories.map((cat, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-[#E2E8F0] bg-white flex justify-between">
                    <div>
                      <span className="font-bold text-[#0F172A]">{cat.name}</span>
                      <span className="text-[10px] text-[#64748B] block truncate max-w-[160px]">{cat.reason}</span>
                    </div>
                    <span className="font-bold text-[#4F46E5]">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Drafted Tasks ({draft.tasks.length})</span>
              <div className="max-h-40 overflow-y-auto divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-lg">
                {draft.tasks.map((t, i) => (
                  <div key={i} className="p-2 text-xs flex justify-between">
                    <span className="font-semibold text-[#0F172A]">{t.title}</span>
                    <span className="text-[11px] text-[#64748B]">T-{t.daysBeforeEvent}d</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-between">
              <Button variant="ghost" onClick={() => setDraftModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={savingDraft} onClick={handleSaveDraft}>
                <Check className="w-4 h-4 mr-1" />
                <span>Save to Plan</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Shareable Event Summary"
        maxWidth="md"
      >
        <div className="space-y-3">
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-xs text-[#0F172A] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {shareableText}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
            <Button variant="primary" size="sm" onClick={() => {
              navigator.clipboard.writeText(shareableText);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}>
              {copied ? 'Copied!' : 'Copy Summary'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
