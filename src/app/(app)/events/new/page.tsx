'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EventType, PlanDraft } from '@/types';
import { parseToMinorUnits, formatMoney } from '@/lib/calculations';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  CalendarDays,
  Users,
  Wallet,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ChevronRight,
  Bot,
} from 'lucide-react';

export default function AIEventPlannerPage() {
  const router = useRouter();

  // Default event date: 3 months in the future
  const defaultFutureDate = new Date();
  defaultFutureDate.setDate(defaultFutureDate.getDate() + 90);
  const defaultDateStr = defaultFutureDate.toISOString().split('T')[0];

  const [eventType, setEventType] = useState<EventType>('wedding');
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState(defaultDateStr);
  const [guestCount, setGuestCount] = useState('100');
  const [totalBudgetDisplay, setTotalBudgetDisplay] = useState('500000');
  const [location, setLocation] = useState('Jaipur, Rajasthan');
  const [themeStyle, setThemeStyle] = useState('Royal Traditional');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Traditional', 'Outdoor', 'Elegant', 'Food Focused']);
  const [specialRequests, setSpecialRequests] = useState('');

  // Generation State
  const [generating, setGenerating] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState<PlanDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableTags = ['Traditional', 'Outdoor', 'Elegant', 'Food Focused', 'Photography', 'Live Music', 'Sustainable'];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      // 1. Create the Event
      const budgetMinor = parseToMinorUnits(totalBudgetDisplay);
      const eventPayload = {
        name,
        event_type: eventType,
        event_date: eventDate,
        city: location,
        currency: 'INR',
        guest_count: parseInt(guestCount, 10) || 100,
        total_budget: budgetMinor,
        preferences: {
          theme: themeStyle,
          tags: selectedTags,
          specialRequests,
        },
      };

      const eventRes = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload),
      });

      const eventData = await eventRes.json();
      if (!eventRes.ok) throw new Error(eventData.error || 'Failed to create event');

      const newId = eventData.event.id;
      setCreatedEventId(newId);

      // 2. Generate Plan Draft via Gemini API
      const draftRes = await fetch(`/api/events/${newId}/generate-plan`, {
        method: 'POST',
      });
      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.error || 'Failed to generate plan');

      setGeneratedDraft(draftData.draft);

      // 3. Automatically save the initial draft
      await fetch(`/api/events/${newId}/save-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftData.draft }),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating plan';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Robot Graphic Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-1">
          <div className="flex items-center gap-2 text-[#4F46E5]">
            <Sparkles className="w-5 h-5" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">AI Event Planner</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Tell us about your event and let AI create a personalized plan with budget, timeline, vendors and creative ideas.
          </p>
        </div>

        {/* Powered by AI Promo Banner */}
        <div className="bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] p-4 rounded-2xl border border-[#E0E7FF] flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-[#0F172A]">Your Dream Event, Powered by AI</h4>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Personalized plans based on your preferences, budget and event type.
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Main Grid: Form / Generated Plan on Left, Sidebar Tips on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Step 1 (Event Details) & Step 2 (Personalized Plan) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Event Details Card */}
          <Card>
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <CardTitle className="text-sm font-bold text-[#0F172A]">Event Details</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleGeneratePlan} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="Event Title"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav & Meera's Wedding, Riya's 25th Birthday..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Event Type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    options={[
                      { value: 'wedding', label: 'Wedding' },
                      { value: 'birthday', label: 'Birthday' },
                      { value: 'community', label: 'Community' },
                    ]}
                  />

                  <Input
                    label="Event Date"
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />

                  <Input
                    label="Guest Count"
                    type="number"
                    min="1"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Total Budget (₹)"
                    type="number"
                    required
                    value={totalBudgetDisplay}
                    onChange={(e) => setTotalBudgetDisplay(e.target.value)}
                  />

                  <Input
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Jaipur, Rajasthan"
                  />

                  <Select
                    label="Theme / Style (Optional)"
                    value={themeStyle}
                    onChange={(e) => setThemeStyle(e.target.value)}
                    options={[
                      { value: 'Royal Traditional', label: 'Royal Traditional' },
                      { value: 'Modern Minimalist', label: 'Modern Minimalist' },
                      { value: 'Garden Bohemian', label: 'Garden Bohemian' },
                      { value: 'Festive Carnival', label: 'Festive Carnival' },
                      { value: 'Classic Formal', label: 'Classic Formal' },
                    ]}
                  />
                </div>

                {/* Preference Tags */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-[#0F172A]">
                    Your Preferences <span className="text-[#94A3B8] font-normal">(Optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]'
                              : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1]'
                          }`}
                        >
                          {isSelected ? `✓ ${tag}` : tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Special Requests */}
                <div className="space-y-1 pt-1">
                  <Textarea
                    label="Special Requests / Custom Vision"
                    rows={2}
                    maxLength={500}
                    placeholder="Any special requests or ideas? e.g. specific colors, must-have vendors, cultural elements..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                  <div className="text-right text-[10px] text-[#94A3B8]">{specialRequests.length}/500</div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={generating}
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    <span>Generate Plan</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Step 2: Your Personalized Plan Preview */}
          {generatedDraft && createdEventId && (
            <Card className="border-[#4F46E5] shadow-md">
              <CardHeader className="border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <CardTitle className="text-sm font-bold text-[#0F172A]">Your Personalized Plan</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Event Cover Box */}
                <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                  <div
                    className="h-36 bg-cover bg-center p-4 relative flex items-start"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80')`,
                    }}
                  >
                    <span className="bg-white/90 text-[#4F46E5] text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      AI Generated
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-lg text-[#0F172A]">{name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                      <span>📅 {eventDate}</span>
                      <span>📍 {location}</span>
                      <span>👥 {guestCount} guests</span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {generatedDraft.summary}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedTags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4 Generated Metric Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] font-semibold uppercase">Estimated Budget</span>
                      <div className="font-bold text-sm text-[#0F172A] mt-0.5">
                        {formatMoney(parseToMinorUnits(totalBudgetDisplay), 'INR')}
                      </div>
                      <span className="text-[10px] text-[#059669] font-medium">Within budget</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] font-semibold uppercase">Timeline</span>
                      <div className="font-bold text-sm text-[#0F172A] mt-0.5">
                        {generatedDraft.tasks.length} milestones
                      </div>
                      <span className="text-[10px] text-[#64748B]">Detailed sequential schedule</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] font-semibold uppercase">Key Categories</span>
                      <div className="font-bold text-sm text-[#0F172A] mt-0.5">
                        {generatedDraft.budgetCategories.length} recommended
                      </div>
                      <span className="text-[10px] text-[#64748B]">With starter allocations</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] font-semibold uppercase">Top Ideas</span>
                      <div className="font-bold text-sm text-[#0F172A] mt-0.5">
                        {generatedDraft.ideas.length} personalized
                      </div>
                      <span className="text-[10px] text-[#64748B]">Tailored concept touches</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                  </div>
                </div>

                {/* View Full Plan Button */}
                <Link href={`/events/${createdEventId}`} className="block">
                  <Button variant="primary" className="w-full justify-center">
                    <span>View Full Plan & Timeline</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Recent Plans & Quick Tips */}
        <div className="space-y-6">
          {/* Recent Plans Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Your Events</CardTitle>
              </div>
              <Link href="/events" className="text-xs text-[#4F46E5] font-semibold hover:underline">
                View all
              </Link>
            </CardHeader>

            <CardContent className="p-4">
              <Link href="/events" className="block">
                <div className="p-3 rounded-xl border border-[#E2E8F0] hover:border-[#4F46E5] transition-all bg-[#F8FAFC] flex items-center justify-between group">
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#4F46E5]">Browse All Events</h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">View and manage your event plans</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Tips Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
                <CardTitle className="text-sm">Quick Tips</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  %
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A]">Keep 10–15% extra for contingency</h4>
                  <p className="text-[#64748B] text-[11px] mt-0.5">It helps absorb minor overtime or unexpected delivery fees.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  ★
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A]">Book popular vendors early</h4>
                  <p className="text-[#64748B] text-[11px] mt-0.5">Venues and photographers fill up months in peak season.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A]">Use a theme to guide decisions</h4>
                  <p className="text-[#64748B] text-[11px] mt-0.5">It streamlines decor, music, and food choices consistently.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
