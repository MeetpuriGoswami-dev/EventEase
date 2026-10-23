'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, ChevronDown, User, LogOut, Sparkles, Menu, X } from 'lucide-react';
import Link from 'next/link';

export function AppHeader({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDemoToggle = async () => {
    try {
      await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login' }),
      });
      router.refresh();
      window.location.reload();
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
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
      {/* Mobile Burger and Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#F1F5F9]"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search events, tasks, vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          aria-label="Notifications"
          className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-400 to-indigo-500 border-2 border-white shadow-xs flex items-center justify-center text-white font-semibold text-xs overflow-hidden">
              <span className="select-none">PS</span>
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-semibold text-[#0F172A]">
                {userEmail ? (userEmail.startsWith('00000000') ? 'Demo Evaluator' : 'Priya Sharma') : 'Guest User'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-[#E2E8F0] text-[11px] text-[#64748B]">
                Signed in as <br />
                <span className="font-semibold text-[#0F172A]">{userEmail || 'Demo Mode'}</span>
              </div>
              <button
                onClick={handleDemoToggle}
                className="w-full text-left px-3 py-2 text-[#4F46E5] hover:bg-[#EEF2FF] flex items-center gap-2 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Switch to 1-Click Demo</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex">
          <div className="w-64 bg-white h-full p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <span className="font-bold text-base text-[#0F172A]">EventEase</span>
              <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5 text-[#64748B]" /></button>
            </div>
            <nav className="space-y-1 text-sm font-medium">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#0F172A] hover:bg-[#F1F5F9]">Dashboard</Link>
              <Link href="/events" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#0F172A] hover:bg-[#F1F5F9]">My Events</Link>
              <Link href="/events/new" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#4F46E5] font-semibold bg-[#EEF2FF]">AI Event Planner</Link>
            </nav>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}
