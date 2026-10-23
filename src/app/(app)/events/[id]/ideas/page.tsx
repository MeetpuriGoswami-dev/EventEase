'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Event } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Sparkles,
  Lightbulb,
  Zap,
  Bot,
  ChevronRight,
  ArrowRight,
  Check,
  CalendarDays,
  MapPin,
  Users,
} from 'lucide-react';

export default function IdeasPage() {
  const { id: eventId } = useParams() as { id: string };
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState('All Ideas');

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((d) => setEvent(d.event));
  }, [eventId]);

  const categories = ['All Ideas', 'Themes', 'Decorations', 'Food & Beverages', 'Activities', 'Entertainment', 'Photography'];

  const mainRecommendations = [
    {
      title: 'Royal Garden Theme',
      category: 'Theme',
      desc: 'A perfect blend of nature, elegance and timeless beauty for your celebration.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
      tags: ['Elegant', 'Outdoor', 'Floral'],
    },
    {
      title: 'Fairy Light Decor',
      category: 'Decor',
      desc: 'Create a magical ambiance with warm fairy lights and cascading chiffon drapes.',
      image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80',
      tags: ['Magical', 'Romantic', 'Elegant'],
    },
    {
      title: 'Multi-Cuisine Buffet',
      category: 'Food',
      desc: 'A delightful mix of traditional and modern cuisines tailored for all dietary preferences.',
      image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=80',
      tags: ['Indian', 'Continental', 'Live Counters'],
    },
    {
      title: 'Live Band Performance',
      category: 'Entertainment',
      desc: 'Add energy and excitement with a live band to captivate your guests all evening.',
      image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80',
      tags: ['Music', 'Live', 'Interactive'],
    },
  ];

  const moreCreativeIdeas = [
    {
      title: 'Unique Welcome Gifts',
      desc: 'Personalized artisan hampers for arriving attendees to set the festive tone.',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
      tag: 'Thoughtful',
    },
    {
      title: 'Photo Booth Setup',
      desc: 'Fun props, customized neon backdrop, and instant photo prints for keepsakes.',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=400&q=80',
      tag: 'Interactive',
    },
    {
      title: 'Signature Mocktails & Drinks',
      desc: 'Curated botanic infusions and regional signature refreshments.',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
      tag: 'Trendy',
    },
    {
      title: 'Outdoor Garden Ceremony',
      desc: 'Natural floral canopy setting under the open sky for special vows.',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=400&q=80',
      tag: 'Romantic',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Mascot */}
      <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FDF2F8] p-6 rounded-2xl border border-[#E0E7FF] flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#4F46E5]">
            <Sparkles className="w-5 h-5" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              AI Ideas &amp; Recommendations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Get personalized suggestions for themes, decor, food, activities and more — curated for your event.
          </p>
        </div>

        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-[#4F46E5] text-white items-center justify-center shadow-xs">
          <Bot className="w-6 h-6" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 py-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === cat
                ? 'bg-[#4F46E5] text-white shadow-xs'
                : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personalized Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-[#0F172A]">Personalized Recommendations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mainRecommendations.map((item) => (
                <Card key={item.title} className="overflow-hidden hover:border-[#4F46E5] transition-all flex flex-col justify-between">
                  <div>
                    <div
                      className="h-32 bg-cover bg-center p-3 relative flex items-start"
                      style={{ backgroundImage: `url(${item.image})` }}
                    >
                      <span className="bg-white/95 text-[#4F46E5] text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                        {item.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-[#0F172A]">{item.title}</h4>
                      <p className="text-xs text-[#64748B] line-clamp-2">{item.desc}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((t) => (
                          <span key={t} className="text-[10px] font-medium bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-between items-center text-xs font-semibold text-[#4F46E5]">
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* More Creative Ideas */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-[#0F172A]">More Creative Ideas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {moreCreativeIdeas.map((idea) => (
                <Card key={idea.title} className="overflow-hidden hover:border-[#4F46E5] transition-all flex flex-col justify-between">
                  <div>
                    <div
                      className="h-24 bg-cover bg-center"
                      style={{ backgroundImage: `url(${idea.image})` }}
                    />
                    <div className="p-3 space-y-1">
                      <h5 className="font-bold text-xs text-[#0F172A] truncate">{idea.title}</h5>
                      <span className="text-[10px] font-medium text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.2 rounded inline-block">
                        {idea.tag}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Event Details Card */}
          {event && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Event Details</CardTitle>
                <Link href={`/events/${eventId}`} className="text-xs text-[#4F46E5] font-semibold hover:underline">
                  Edit
                </Link>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="font-bold text-sm text-[#0F172A]">{event.name}</div>
                <div className="flex items-center gap-1.5 text-[#64748B]">
                  <CalendarDays className="w-3.5 h-3.5" /> <span>{event.event_date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#64748B]">
                  <MapPin className="w-3.5 h-3.5" /> <span>{event.city || 'Jaipur, Rajasthan'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#64748B]">
                  <Users className="w-3.5 h-3.5" /> <span>{event.guest_count || 100} guests</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestions for You Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">AI Suggestions for You</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#4F46E5] transition-all bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-[#0F172A]">Theme Suggestion</h5>
                  <p className="text-[10px] text-[#64748B]">Boho-chic theme with natural elements and warm lighting.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>

              <div className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#4F46E5] transition-all bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-[#0F172A]">Budget Optimization</h5>
                  <p className="text-[10px] text-[#64748B]">Save up to 15% by choosing local vendors and package deals.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>

              <div className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#4F46E5] transition-all bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-[#0F172A]">Activity Ideas</h5>
                  <p className="text-[10px] text-[#64748B]">Interactive polaroid photo wall and memory board.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
            </CardContent>
          </Card>

          {/* Plan Stress Test Card */}
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-[#059669] font-bold text-xs">
              <Zap className="w-4 h-4" />
              <span>Plan Stress Test</span>
            </div>
            <p className="text-xs text-[#047857]">
              Simulate changes and see the impact on your budget and timeline in real time.
            </p>
            <Link href={`/events/${eventId}/stress-test`} className="block">
              <Button variant="primary" size="sm" className="w-full bg-[#10B981] hover:bg-[#059669]">
                <span>Run Stress Test</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
