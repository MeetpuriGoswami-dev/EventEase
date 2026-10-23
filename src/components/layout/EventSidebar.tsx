'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  Users,
  Lightbulb,
  Zap,
} from 'lucide-react';

interface EventSidebarProps {
  eventId: string;
  eventName: string;
  eventType: string;
}

export function EventSidebar({ eventId, eventName }: EventSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview',
      href: `/events/${eventId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Timeline & Tasks',
      href: `/events/${eventId}/timeline`,
      icon: CheckSquare,
    },
    {
      label: 'Budget Tracker',
      href: `/events/${eventId}/budget`,
      icon: Wallet,
    },
    {
      label: 'Vendor Quotes',
      href: `/events/${eventId}/vendors`,
      icon: Users,
    },
    {
      label: 'Ideas & Risks',
      href: `/events/${eventId}/ideas`,
      icon: Lightbulb,
    },
    {
      label: 'Plan Stress Test',
      href: `/events/${eventId}/stress-test`,
      icon: Zap,
      highlight: true,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E4DDD2] shrink-0 p-4">
        <div className="mb-6 px-3 py-2 bg-[#FBF9F5] rounded-xl border border-[#E4DDD2]">
          <span className="text-[10px] font-semibold tracking-wider text-[#8A847C] uppercase">Active Plan</span>
          <h2 className="text-sm font-semibold text-[#1C1917] truncate">{eventName}</h2>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : item.highlight
                    ? 'text-[#C85A32] hover:bg-[#FBF0EB]'
                    : 'text-[#625D56] hover:text-[#1C1917] hover:bg-[#F4EFE6]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-[#C85A32]' : 'text-[#8A847C]'}`} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[10px] bg-[#FBF0EB] text-[#C85A32] px-1.5 py-0.5 rounded font-semibold border border-[#F2D6CA]">
                    Signature
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Horizontal Navigation Pills */}
      <div className="md:hidden flex overflow-x-auto gap-1.5 p-2 bg-white border-b border-[#E4DDD2] sticky top-[57px] z-30 no-scrollbar">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'text-[#625D56] bg-[#F4EFE6] border border-[#E4DDD2]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
