'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Task, TaskPriority, TaskStatus, Event } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PriorityBadge, TaskStatusBadge } from '@/components/ui/Badge';
import {
  Plus,
  CalendarDays,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Bot,
  Sparkles,
  ChevronRight,
  PartyPopper,
  Flag,
  ArrowUpRight,
  Calendar,
  Layers,
  Search,
  Filter,
  CheckSquare,
  Zap,
  MoreVertical,
  FileText,
  Settings,
  Users2,
  HardHat,
  CircleDot,
  CheckCircle,
  PlayCircle
} from 'lucide-react';

export default function TimelineTasksPage() {
  const { id: eventId } = useParams() as { id: string };
  const [event, setEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Venue');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  // Milestone phase selection for interactive preview
  const [selectedPhase, setSelectedPhase] = useState<number>(0);

  const fetchTimelineData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, [eventId]);

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isToday: false,
    isPast: false,
  });

  // Countdown timer: live ticking down to event day 09:00 AM
  useEffect(() => {
    if (!event?.event_date) return;

    const tick = () => {
      // Parse event date accurately: format YYYY-MM-DD
      const parts = event.event_date.split('-').map(Number);
      const evYear = parts[0];
      const evMonth = parts[1] - 1; // 0-indexed
      const evDay = parts[2];

      const target = new Date(evYear, evMonth, evDay, 9, 0, 0);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();

      // Check if current date is the same calendar day as event_date
      const isSameDay =
        now.getFullYear() === evYear &&
        now.getMonth() === evMonth &&
        now.getDate() === evDay;

      if (isSameDay) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true, isPast: false });
        return;
      }

      if (diffMs <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: false, isPast: true });
        return;
      }

      const totalSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSecs / (3600 * 24));
      const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        isToday: false,
        isPast: false,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [event?.event_date]);

  const completedTasks = tasks.filter((t) => t.status === 'done');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.due_date < todayStr);
  const upcomingTasks = tasks.filter((t) => t.status !== 'done' && t.due_date >= todayStr);
  const todayTasks = tasks.filter((t) => t.due_date === todayStr);

  const progressPercent = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;


  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (activeFilter === 'completed') return t.status === 'done';
    if (activeFilter === 'overdue') return t.status !== 'done' && new Date(`${t.due_date}T00:00:00`) < new Date();
    if (activeFilter === 'upcoming') return t.status !== 'done' && new Date(`${t.due_date}T00:00:00`) >= new Date();
    return true;
  });

  const handleOpenAddModal = (presetTitle?: string, presetCategory?: string) => {
    setEditingTask(null);
    setTitle(presetTitle || '');
    setDescription('');
    setCategory(presetCategory || 'Venue');
    setDueDate(event?.event_date || '2025-04-15');
    setPriority('medium');
    setModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category || 'General');
    setDueDate(task.due_date);
    setPriority(task.priority);
    setModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            category,
            due_date: dueDate,
            priority,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? data.task : t)));
          setModalOpen(false);
        }
      } else {
        const res = await fetch(`/api/events/${eventId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            category,
            due_date: dueDate,
            priority,
            status: 'todo',
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setTasks((prev) => [...prev, data.task]);
          setModalOpen(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to remove this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // State for generating auto-plan
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const handleAutoGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      // 1. Generate plan draft with AI
      const genRes = await fetch(`/api/events/${eventId}/generate-plan`, { method: 'POST' });
      const genData = await genRes.json();
      if (!genRes.ok || !genData.draft) {
        alert(genData.error || 'Failed to generate plan');
        return;
      }

      // 2. Save plan tasks to database
      const saveRes = await fetch(`/api/events/${eventId}/save-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: genData.draft }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        alert(saveData.error || 'Failed to save tasks');
        return;
      }

      // Refresh timeline with newly created tasks
      await fetchTimelineData();
    } catch (err) {
      console.error(err);
      alert('An error occurred while generating activities.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Build dynamic milestones directly from user's planned tasks/activities
  const computeMilestones = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If event has tasks, create dynamic milestones from the actual tasks grouped by phase/category
    if (tasks.length > 0) {
      // Group tasks by category or logical stage
      const groups = new Map<string, Task[]>();
      tasks.forEach((t) => {
        const cat = t.category || 'General';
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat)!.push(t);
      });

      // Map each group into a milestone node
      const milestones = Array.from(groups.entries()).map(([catName, catTasks], idx) => {
        // Sort tasks in this milestone by due_date
        const sorted = [...catTasks].sort((a, b) => a.due_date.localeCompare(b.due_date));
        const earliestDate = sorted[0]?.due_date || event?.event_date || '';
        const latestDate = sorted[sorted.length - 1]?.due_date || earliestDate;

        const allDone = catTasks.length > 0 && catTasks.every((t) => t.status === 'done');
        const anyDone = catTasks.some((t) => t.status === 'done');
        const hasOverdue = catTasks.some((t) => t.status !== 'done' && t.due_date < todayStr);

        let status: 'completed' | 'in_progress' | 'pending' = 'pending';
        if (allDone) {
          status = 'completed';
        } else if (anyDone || hasOverdue) {
          status = 'in_progress';
        }

        // Pick icon based on category name
        let iconType = 'document';
        const lower = catName.toLowerCase();
        if (lower.includes('venue') || lower.includes('setup') || lower.includes('stage')) iconType = 'setup';
        else if (lower.includes('food') || lower.includes('beverage') || lower.includes('cater')) iconType = 'palette';
        else if (lower.includes('vendor') || lower.includes('photo') || lower.includes('music')) iconType = 'vendors';
        else if (lower.includes('guest') || lower.includes('invite')) iconType = 'document';
        else if (lower.includes('day') || lower.includes('event')) iconType = 'flag';

        return {
          id: `cat-${idx}-${catName}`,
          name: catName,
          dateLabel: new Date(earliestDate + 'T00:00:00').toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          }),
          earliestDate,
          latestDate,
          iconType,
          status,
          taskCount: catTasks.length,
          doneCount: catTasks.filter((t) => t.status === 'done').length,
          tasks: catTasks,
          desc: `${catTasks.length} activity plan: ${catTasks.map((t) => t.title).slice(0, 2).join(', ')}${catTasks.length > 2 ? '...' : ''}`,
        };
      });

      // Sort milestones chronologically by earliest due date
      return milestones.sort((a, b) => a.earliestDate.localeCompare(b.earliestDate));
    }

    // Fallback: If no tasks have been created yet, generate dynamic steps from event_date
    if (!event?.event_date) return [];
    const parts = event.event_date.split('-').map(Number);
    const eventTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
    const nowTime = new Date().getTime();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const formatShort = (ts: number) => {
      return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    const emptyPhases = [
      { id: 'p1', name: 'Planning & Concept', date: eventTime - 45 * MS_PER_DAY, icon: 'document', desc: 'Define budget, guest count & themes' },
      { id: 'p2', name: 'Vendor Bookings', date: eventTime - 30 * MS_PER_DAY, icon: 'vendors', desc: 'Secure venue, caterer, decor & photography' },
      { id: 'p3', name: 'Design & Invites', date: eventTime - 15 * MS_PER_DAY, icon: 'palette', desc: 'Finalize invitation cards and theme elements' },
      { id: 'p4', name: 'Final Walkthrough', date: eventTime - 3 * MS_PER_DAY, icon: 'setup', desc: 'Coordinate vendor schedules and setup' },
      { id: 'p5', name: 'Celebration Day', date: eventTime, icon: 'flag', desc: 'Event day execution' },
    ];

    return emptyPhases.map((p) => {
      const isPast = nowTime > p.date;
      return {
        id: p.id,
        name: p.name,
        dateLabel: formatShort(p.date),
        earliestDate: new Date(p.date).toISOString().split('T')[0],
        latestDate: new Date(p.date).toISOString().split('T')[0],
        iconType: p.icon,
        status: isPast ? ('completed' as const) : ('pending' as const),
        taskCount: 0,
        doneCount: 0,
        tasks: [] as Task[],
        desc: p.desc,
      };
    });
  };

  const dynamicPhases = computeMilestones();
  const currentPhaseIndex = Math.min(
    selectedPhase,
    Math.max(0, dynamicPhases.length - 1)
  );
  const activeMilestone = dynamicPhases[currentPhaseIndex] || dynamicPhases[0];


  return (
    <div className="space-y-6">
      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Timeline Roadmap Card - Styled after sample design */}
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden bg-white rounded-2xl">
            <CardHeader className="border-b border-[#F1F5F9] pb-4 flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">Project Timeline</CardTitle>
                <p className="text-xs text-[#64748B] mt-0.5">Track the progress of key milestones from planning to celebration.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {tasks.length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoGeneratePlan}
                    isLoading={generatingPlan}
                    className="border-indigo-200 text-[#4F46E5] hover:bg-indigo-50 shadow-2xs text-xs font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-[#4F46E5]" />
                    <span>Auto-Generate Plan</span>
                  </Button>
                )}

                {event?.event_date && (
                  <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#475569]">
                    <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>Event: {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Horizontal Timeline Chain */}
              <div className="relative py-4 overflow-x-auto">
                <div className="min-w-[620px] relative">
                  {/* Base Track */}
                  <div className="absolute top-5 left-10 right-10 h-0.5 bg-[#E2E8F0] -z-0" />

                  {/* Connected Step Nodes */}
                  <div
                    className="gap-2 relative z-10"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${Math.max(1, dynamicPhases.length)}, minmax(110px, 1fr))`,
                    }}
                  >
                    {dynamicPhases.map((phase, idx) => {
                      const isCompleted = phase.status === 'completed';
                      const isInProgress = phase.status === 'in_progress';
                      const isSelected = currentPhaseIndex === idx;

                      // Phase Icon Component
                      const renderIcon = () => {
                        switch (phase.iconType) {
                          case 'document':
                            return <FileText className="w-5 h-5" />;
                          case 'palette':
                            return <Settings className="w-5 h-5" />;
                          case 'vendors':
                            return <Users2 className="w-5 h-5" />;
                          case 'setup':
                            return <HardHat className="w-5 h-5" />;
                          case 'flag':
                            return <Flag className="w-5 h-5" />;
                          case 'check':
                          default:
                            return <Check className="w-5 h-5" />;
                        }
                      };

                      return (
                        <div
                          key={phase.id}
                          onClick={() => setSelectedPhase(idx)}
                          className={`flex flex-col items-center text-center cursor-pointer group transition-all duration-150 p-2 rounded-xl ${
                            isSelected ? 'bg-indigo-50/50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Circular Node Icon */}
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-xs transition-transform duration-200 group-hover:scale-105 ${
                              isCompleted
                                ? 'bg-[#059669] text-white shadow-emerald-500/20'
                                : isInProgress
                                ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 shadow-blue-500/20'
                                : 'bg-[#94A3B8] text-white'
                            }`}
                          >
                            {renderIcon()}
                          </div>

                          {/* Phase Title */}
                          <span className="font-bold text-xs text-[#0F172A] mt-2.5 truncate max-w-[90px]">
                            {phase.name}
                          </span>

                          {/* Date Label */}
                          <span className="text-[10px] text-[#64748B] font-medium mt-0.5">
                            {phase.dateLabel}
                          </span>

                          {/* Status Badge */}
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[#059669]">
                                <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                                <span>Completed</span>
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 text-[#2563EB]">
                                <CircleDot className="w-3 h-3 text-[#2563EB] animate-pulse" />
                                <span>In Progress</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#94A3B8]">
                                <span className="w-2.5 h-2.5 rounded-full border border-[#94A3B8]" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Milestone Focus Banner */}
              {activeMilestone && (
                <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      activeMilestone.status === 'completed'
                        ? 'bg-[#059669]'
                        : activeMilestone.status === 'in_progress'
                        ? 'bg-[#2563EB] animate-ping'
                        : 'bg-[#94A3B8]'
                    }`} />
                    <div>
                      <span className="font-extrabold text-[#0F172A]">
                        {activeMilestone.name}:
                      </span>{' '}
                      <span className="text-[#64748B]">{activeMilestone.desc}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="text-[11px] font-semibold text-[#64748B] bg-white px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                      {activeMilestone.doneCount} / {activeMilestone.taskCount} tasks done
                    </span>
                    <button
                      onClick={() => handleOpenAddModal(`Task for ${activeMilestone.name}`, activeMilestone.name)}
                      className="px-3 py-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      + Add Task
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Task Checklist Card */}
          <Card className="border-[#E2E8F0] shadow-xs">
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-[#0F172A]">Task Checklist</CardTitle>
                  <p className="text-[11px] text-[#64748B]">Track actionable tasks, set priorities and never miss a deadline.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => handleOpenAddModal()}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Task</span>
                </Button>
              </div>
            </CardHeader>

            {/* Filter Pills & Quick Search Row */}
            <div className="p-4 bg-[#F8FAFC] border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap rounded-xl bg-white p-1 border border-[#E2E8F0] text-xs font-bold shadow-2xs">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                    activeFilter === 'all' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  All ({tasks.length})
                </button>
                <button
                  onClick={() => setActiveFilter('upcoming')}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                    activeFilter === 'upcoming' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Upcoming ({upcomingTasks.length})
                </button>
                <button
                  onClick={() => setActiveFilter('overdue')}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                    activeFilter === 'overdue' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Overdue ({overdueTasks.length})
                </button>
                <button
                  onClick={() => setActiveFilter('completed')}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                    activeFilter === 'completed' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Completed ({completedTasks.length})
                </button>
              </div>

              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-[#0F172A]"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#94A3B8] font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4 text-center">Category</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4 text-center">Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No tasks found in this view. Click &quot;Add Task&quot; to create one!
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isDone = task.status === 'done';
                      const isOverdue = new Date(`${task.due_date}T00:00:00`) < new Date() && !isDone;

                      return (
                        <tr key={task.id} className="hover:bg-[#F8FAFC]/80 transition-colors group">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => toggleTaskStatus(task)}
                                className="w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5] border-slate-300 accent-[#4F46E5] cursor-pointer"
                              />
                              <div>
                                <span className={`font-bold block ${isDone ? 'line-through text-slate-400' : 'text-[#0F172A]'}`}>
                                  {task.title}
                                </span>
                                {task.description && (
                                  <p className="text-[10px] text-[#64748B] mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100">
                              {task.category || 'General'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <PriorityBadge priority={task.priority} />
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono">
                            <span className={`inline-flex items-center gap-1 text-[11px] ${
                              isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'
                            }`}>
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{task.due_date}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isDone
                                ? 'bg-[#ECFDF5] text-[#059669] border border-emerald-200'
                                : isOverdue
                                ? 'bg-[#FEE2E2] text-[#DC2626] border border-red-200'
                                : 'bg-[#F1F5F9] text-slate-600 border border-slate-200'
                            }`}>
                              {isDone ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(task)}
                                className="p-1 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-md cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Luxury Countdown, Deadlines & AI Copilot */}
        <div className="space-y-6">
          {/* Luxury Event Countdown Box */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white shadow-xl shadow-indigo-500/20 overflow-hidden border border-indigo-400/30">
            {/* Ambient decorative glow */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-purple-500/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4 text-center">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                  <Clock className="w-3 h-3 text-amber-300" />
                  <span>Event Countdown</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live
                </span>
              </div>

              {/* 4 Glowing Count Boxes */}
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shadow-inner">
                  <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                    {countdown.days}
                  </div>
                  <span className="text-[9px] text-indigo-200 uppercase font-extrabold tracking-wider mt-0.5 block">
                    Days
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shadow-inner">
                  <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                    {String(countdown.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] text-indigo-200 uppercase font-extrabold tracking-wider mt-0.5 block">
                    Hours
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shadow-inner">
                  <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                    {String(countdown.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] text-indigo-200 uppercase font-extrabold tracking-wider mt-0.5 block">
                    Mins
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shadow-inner">
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums tracking-tight animate-pulse">
                    {String(countdown.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] text-amber-200 uppercase font-extrabold tracking-wider mt-0.5 block">
                    Secs
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-100 pt-1">
                <PartyPopper className="w-4 h-4 text-amber-400" />
                <span>
                  {countdown.isToday
                    ? '🎉 Event Day is Today! Celebration in Progress!'
                    : countdown.isPast
                    ? 'Event successfully completed!'
                    : 'Your big day is approaching fast!'}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines with real data */}
          <Card className="border-[#E2E8F0] shadow-xs">
            <CardHeader className="border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm font-bold text-[#0F172A]">Upcoming Deadlines</CardTitle>
              </div>
              <button
                onClick={() => setActiveFilter('upcoming')}
                className="text-xs text-[#4F46E5] font-bold hover:underline cursor-pointer"
              >
                View All ({upcomingTasks.length}) →
              </button>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              {upcomingTasks.length === 0 && overdueTasks.length === 0 ? (
                <div className="text-center py-4 text-[#94A3B8]">
                  <p className="text-[11px]">No pending deadlines.</p>
                </div>
              ) : (
                [...overdueTasks, ...upcomingTasks].slice(0, 4).map((task) => {
                  const isOverdue = task.due_date < todayStr;
                  const isDueToday = task.due_date === todayStr;

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9] last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isOverdue
                              ? 'bg-red-100 text-red-600'
                              : isDueToday
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-indigo-100 text-[#4F46E5]'
                          }`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-[#0F172A] truncate text-[11px]">{task.title}</h5>
                          <p className="text-[10px] text-[#64748B]">
                            {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isOverdue
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : isDueToday
                            ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-[#EEF2FF] text-[#4F46E5]'
                        }`}
                      >
                        {isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : 'Upcoming'}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Today's Tasks Agenda Card with real data */}
          <Card className="border-[#E2E8F0] shadow-xs">
            <CardHeader className="border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm font-bold text-[#0F172A]">Today&apos;s Tasks</CardTitle>
              </div>
              <span className="text-[11px] font-semibold text-[#64748B]">
                {todayTasks.length} task{todayTasks.length === 1 ? '' : 's'}
              </span>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5 text-xs">
              {todayTasks.length === 0 ? (
                <div className="text-center py-4 text-[#94A3B8]">
                  <p className="text-[11px]">No tasks scheduled for today.</p>
                  <button
                    onClick={() => handleOpenAddModal('New task for today', 'General')}
                    className="mt-2 text-[11px] text-[#4F46E5] font-bold hover:underline cursor-pointer"
                  >
                    + Schedule task for today
                  </button>
                </div>
              ) : (
                todayTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={t.status === 'done'}
                        onChange={() => toggleTaskStatus(t)}
                        className="w-4 h-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                      />
                      <span className={`font-semibold truncate ${t.status === 'done' ? 'line-through text-slate-400' : 'text-[#0F172A]'}`}>
                        {t.title}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#F1F5F9] text-[#64748B] shrink-0">
                      {t.category || 'General'}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Timeline Assistant Prompt Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#EDE9FE] via-[#F5F3FF] to-[#FAF5FF] border border-purple-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#7C3AED] flex items-center justify-center shadow-xs shrink-0">
                <Bot className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#1E1B4B]">Need help with your timeline?</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Ask our AI assistant for suggestions, reschedule tasks or get smart reminders.
                </p>
              </div>
            </div>

            <Link href={`/events/${eventId}/ideas`}>
              <button className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chat with AI →</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add Custom Task'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Input
            label="Task Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Confirm caterer tasting schedule"
          />

          <Textarea
            label="Description / Checklist Notes"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Venue', label: 'Venue' },
                { value: 'Food & Beverages', label: 'Food & Beverages' },
                { value: 'Photography', label: 'Photography' },
                { value: 'Guests', label: 'Guests' },
                { value: 'Decoration', label: 'Decoration' },
                { value: 'Logistics', label: 'Logistics' },
                { value: 'Planning', label: 'Planning' },
              ]}
            />
            <Input
              label="Due Date"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={[
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' },
            ]}
          />

          <div className="flex justify-between pt-3 border-t border-[#E2E8F0]">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Save Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
