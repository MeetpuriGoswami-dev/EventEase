'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, CalendarDays, Plus, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Navbar({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();

  const handleDemoLogin = async () => {
    try {
      await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login' }),
      });
      router.refresh();
      router.push('/');
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.refresh();
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#E4DDD2] px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 text-[#1B4332] font-semibold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>KitePlan <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-[#E8F0EC] text-[#1B4332] ml-1.5 border border-[#C3DDD0]">Assistant</span></span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/events/new">
          <Button size="sm" variant="primary">
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </Button>
        </Link>

        {userEmail ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#625D56] bg-[#F4EFE6] px-2.5 py-1.5 rounded-md border border-[#E4DDD2]">
              <User className="w-3.5 h-3.5 text-[#1B4332]" />
              <span className="max-w-[140px] truncate">{userEmail}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={handleLogout} title="Sign Out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleDemoLogin} title="1-Click Evaluation Login">
              <span>Demo Mode</span>
            </Button>
            <Link href="/login">
              <Button size="sm" variant="outline">
                <span>Sign In</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
