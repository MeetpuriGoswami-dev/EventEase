'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Event } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  CalendarDays,
  MapPin,
  Users,
  Edit2,
  ArrowLeft,
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Users2,
  Bot,
  Zap,
  Sparkles
} from 'lucide-react';

export function EventHeaderTabs({ event }: { event: Event }) {
  const pathname = usePathname();
  const router = useRouter();

  // Edit Event Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(event.name);
  const [editDate, setEditDate] = useState(event.event_date);
  const [editCity, setEditCity] = useState(event.city || '');
  const [editGuests, setEditGuests] = useState(String(event.guest_count || '100'));
  const [savingEvent, setSavingEvent] = useState(false);

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEvent(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          event_date: editDate,
          city: editCity || null,
          guest_count: Number(editGuests) || null,
        }),
      });
      if (res.ok) {
        setEditModalOpen(false);
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update event');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating event');
    } finally {
      setSavingEvent(false);
    }
  };

  const tabs = [
    { label: 'Overview', href: `/events/${event.id}`, exact: true },
    { label: 'Budget', href: `/events/${event.id}/budget` },
    { label: 'Timeline & Tasks', href: `/events/${event.id}/timeline` },
    { label: 'Vendors', href: `/events/${event.id}/vendors` },
    { label: 'AI Ideas', href: `/events/${event.id}/ideas` },
    { label: 'Plan Stress Test', href: `/events/${event.id}/stress-test`, highlight: true },
  ];

  // Pick cover photo based on event type
  const coverImg = event.event_type === 'wedding'
    ? 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
    : event.event_type === 'birthday'
    ? 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80'
    : 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';

  const badgeColor = event.event_type === 'wedding'
    ? 'bg-[#EEF2FF] text-[#4F46E5]'
    : event.event_type === 'birthday'
    ? 'bg-[#E0F2FE] text-[#0284C7]'
    : 'bg-[#ECFDF5] text-[#10B981]';

  return (
    <div className="space-y-4 mb-6">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#4F46E5] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Event Header Card matching screen3 and screen8 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-5 relative">
          {/* Left: Thumbnail Image */}
          <div className="relative w-full md:w-72 h-44 rounded-xl overflow-hidden shrink-0 shadow-xs border border-[#F1F5F9]">
            <Image
              src={coverImg}
              alt={event.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Middle: Details */}
          <div className="flex-1 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${badgeColor}`}>
                  {event.event_type}
                </span>

                {/* Edit Event Button */}
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Edit Event</span>
                </button>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                {event.name}
              </h1>

              {/* Meta details row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                <span className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                  <CalendarDays className="w-4 h-4 text-[#4F46E5]" />
                  <span>
                    {new Date(`${event.event_date}T00:00:00`).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </span>

                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-[#94A3B8]" />
                  <span>{event.city || 'Jaipur, Rajasthan'}</span>
                </span>

                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-[#94A3B8]" />
                  <span>{event.guest_count ? `${event.guest_count} guests` : '100 guests'}</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2 max-w-2xl">
              {event.description ||
                'A beautiful traditional celebration with elegant decor, curated themes, and a perfect blend of culture and celebration.'}
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 px-6 border-t border-[#F1F5F9] bg-[#FAFAFA] no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`py-3.5 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.highlight && !isActive && (
                  <span className="ml-1.5 text-[9px] bg-[#EEF2FF] text-[#4F46E5] px-1.5 py-0.5 rounded-full font-bold">
                    Signature
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Edit Event Details Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Event Details"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <Input
            label="Event Name"
            required
            value={editName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Event Date"
              type="date"
              required
              value={editDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDate(e.target.value)}
            />

            <Input
              label="Guest Count"
              type="number"
              min="1"
              value={editGuests}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditGuests(e.target.value)}
            />
          </div>

          <Input
            label="Location / City"
            value={editCity}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCity(e.target.value)}
            placeholder="e.g. Mumbai, Maharashtra"
          />

          <div className="flex justify-between pt-3 border-t border-[#E2E8F0]">
            <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={savingEvent}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
