'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Wallet,
  CheckSquare,
  Users2,
  Lightbulb,
  Zap,
  Settings,
  Heart,
  ArrowRight,
} from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const eventId = (params?.id as string) || '';

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'My Events',
      href: '/events',
      icon: Calendar,
      exact: true,
    },
    {
      label: 'AI Event Planner',
      href: '/events/new',
      icon: Sparkles,
      exact: true,
    },
    {
      label: 'Budget',
      href: eventId ? `/events/${eventId}/budget` : '/events',
      icon: Wallet,
      matchPrefix: '/budget',
    },
    {
      label: 'Timeline & Tasks',
      href: eventId ? `/events/${eventId}/timeline` : '/events',
      icon: CheckSquare,
      matchPrefix: '/timeline',
    },
    {
      label: 'Vendors',
      href: eventId ? `/events/${eventId}/vendors` : '/events',
      icon: Users2,
      matchPrefix: '/vendors',
    },
    {
      label: 'AI Ideas',
      href: eventId ? `/events/${eventId}/ideas` : '/events',
      icon: Lightbulb,
      matchPrefix: '/ideas',
    },
    {
      label: 'Plan Stress Test',
      href: eventId ? `/events/${eventId}/stress-test` : '/events',
      icon: Zap,
      matchPrefix: '/stress-test',
    },
    {
      label: 'Settings',
      href: '#',
      icon: Settings,
      disabled: true,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E2E8F0] shrink-0 h-screen sticky top-0 justify-between p-4 z-40">
      <div className="space-y-6">
        {/* EventEase Brand Logo matching design screens */}
        <Link href="/" className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center text-white shadow-xs shrink-0">
            <div className="relative">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
              <Heart className="w-2.5 h-2.5 fill-white text-white absolute top-2 left-[5px]" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg text-[#0F172A] tracking-tight leading-none">EventEase</h1>
            <p className="text-[10px] text-[#94A3B8] font-medium tracking-wider mt-1">Plan • Organize • Celebrate</p>
          </div>
        </Link>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : item.matchPrefix
              ? pathname.includes(item.matchPrefix) || pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.disabled ? '#' : item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#4F46E5]'
                    : item.disabled
                    ? 'text-[#CBD5E1] cursor-not-allowed'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card matching screen1 and screen8 */}
      <div className="bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] p-4 rounded-2xl border border-[#E0E7FF] space-y-3 relative overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#0F172A]">Need help planning your perfect event?</h4>
          <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
            Let our AI assistant create a personalized plan for you.
          </p>
        </div>
        <Link href="/events/new" className="block">
          <button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
            <span>Chat with AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    </aside>
  );
}
