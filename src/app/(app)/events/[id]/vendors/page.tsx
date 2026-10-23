'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Vendor, Event } from '@/types';
import { formatMoney, parseToMinorUnits } from '@/lib/calculations';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Users2,
  CheckCircle2,
  Clock,
  Wallet,
  CreditCard,
  Plus,
  Scale,
  Sparkles,
  ChevronRight,
  Star,
  MapPin,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react';

export default function VendorsPage() {
  const { id: eventId } = useParams() as { id: string };
  const [event, setEvent] = useState<Event | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [comparisonTab, setComparisonTab] = useState<'price' | 'rating' | 'services'>('price');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Venue');
  const [quoteDisplay, setQuoteDisplay] = useState('80000');
  const [status, setStatus] = useState<Vendor['status']>('booked');
  const [contact, setContact] = useState('');
  const [inclusionsText, setInclusionsText] = useState('AC Banquet Hall, Parking, Outdoor Lawn');
  const [exclusionsText, setExclusionsText] = useState('Electricity diesel generator fuel');
  const [notes, setNotes] = useState('');

  const fetchVendorsData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
        setVendors(data.vendors || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorsData();
  }, [eventId]);

  const currency = event?.currency || 'INR';

  // Category Filter Options
  const categories = ['All', 'Venue', 'Catering', 'Decoration', 'Photography', 'Entertainment', 'Makeup & Styling', 'Others'];

  const filteredVendors = vendors.filter((v) =>
    selectedCategory === 'All' ? true : v.category.toLowerCase().includes(selectedCategory.toLowerCase())
  );

  const confirmedCount = vendors.filter((v) => v.status === 'booked').length;
  const pendingQuotesCount = vendors.filter((v) => v.status === 'quote_received' || v.status === 'to_contact').length;
  const totalSpent = vendors.reduce((acc, v) => acc + (v.advance_amount || v.quote_amount || 0), 0);

  const handleOpenAddModal = () => {
    setName('');
    setCategory('Venue');
    setQuoteDisplay('50000');
    setStatus('to_contact');
    setContact('');
    setInclusionsText('');
    setExclusionsText('');
    setNotes('');
    setModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const quoteMinor = quoteDisplay ? parseToMinorUnits(quoteDisplay) : null;
      const inclusions = inclusionsText.split(',').map((s) => s.trim()).filter(Boolean);
      const exclusions = exclusionsText.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await fetch(`/api/events/${eventId}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          status,
          contact,
          quote_amount: quoteMinor,
          currency,
          inclusions,
          exclusions,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVendors((prev) => [...prev, data.vendor]);
        setModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vendor?')) return;
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVendors((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Vendor sample images by category
  const getVendorImage = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('venue')) return 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80';
    if (c.includes('cater')) return 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=80';
    if (c.includes('decor')) return 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80';
    if (c.includes('photo')) return 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=400&q=80';
    return 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80';
  };

  return (
    <div className="space-y-6">
      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B]">Total Vendors</span>
            <div className="text-xl font-extrabold text-[#0F172A] mt-0.5">{vendors.length}</div>
            <p className="text-[10px] text-[#4F46E5] font-medium">{vendors.length === 0 ? 'None added yet' : `${vendors.length} vendor${vendors.length > 1 ? 's' : ''} tracked`}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B]">Confirmed</span>
            <div className="text-xl font-extrabold text-[#0F172A] mt-0.5">{confirmedCount}</div>
            <p className="text-[10px] text-[#059669] font-medium">
              {vendors.length > 0 ? `${Math.round((confirmedCount / vendors.length) * 100)}% of total` : 'None yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B]">Pending Quotes</span>
            <div className="text-xl font-extrabold text-[#0F172A] mt-0.5">{pendingQuotesCount}</div>
            <p className="text-[10px] text-[#D97706] font-medium">
              {vendors.length > 0 ? `${Math.round((pendingQuotesCount / vendors.length) * 100)}% of total` : 'None yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B]">Total Quoted</span>
            <div className="text-xl font-extrabold text-[#0F172A] mt-0.5">{formatMoney(totalSpent, currency)}</div>
            <p className="text-[10px] text-[#64748B]">
              {event ? `of ${formatMoney(event.total_budget, currency)} budget` : 'across all vendors'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] text-[#EC4899] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B]">Pending Payments</span>
            <div className="text-xl font-extrabold text-[#0F172A] mt-0.5">
              {vendors.filter((v) => v.status === 'to_contact' || v.status === 'contacted').length}
            </div>
            <p className="text-[10px] text-[#EC4899] font-medium">
              {vendors.filter((v) => v.status === 'to_contact' || v.status === 'contacted').length === 0 ? 'All confirmed' : 'Not yet booked'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex overflow-x-auto gap-2 py-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Vendors List (2 cols) & Right Comparison / Actions (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendors List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0F172A]">Vendors ({filteredVendors.length})</h3>
            <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add New Vendor</span>
            </Button>
          </div>

          <div className="space-y-3">
            {filteredVendors.map((vendor) => {
              const isConfirmed = vendor.status === 'booked';
              const isPending = vendor.status === 'quote_received' || vendor.status === 'to_contact';
              const statusLabel = isConfirmed ? 'Confirmed' : isPending ? 'Pending Quote' : 'Payment Pending';
              const statusBadgeColor = isConfirmed
                ? 'bg-[#ECFDF5] text-[#059669]'
                : isPending
                ? 'bg-[#FEF3C7] text-[#D97706]'
                : 'bg-[#FEE2E2] text-[#DC2626]';

              return (
                <Card key={vendor.id} className="overflow-hidden hover:border-[#4F46E5] transition-all">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail Image */}
                    <div
                      className="w-full sm:w-28 h-28 rounded-xl bg-cover bg-center shrink-0"
                      style={{ backgroundImage: `url(${getVendorImage(vendor.category)})` }}
                    />

                    {/* Vendor Info */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#0F172A]">{vendor.name}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                              {vendor.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                            <span className="flex items-center gap-1 text-[#F59E0B] font-semibold">
                              <Star className="w-3.5 h-3.5 fill-[#F59E0B]" /> 4.8 (95 reviews)
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#64748B]">
                              <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" /> Jaipur, Rajasthan
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-extrabold text-[#0F172A] block">
                            {vendor.quote_amount ? formatMoney(vendor.quote_amount, vendor.currency) : '₹ 80,000'}
                          </span>
                          <span className="text-[10px] text-[#94A3B8]">package price</span>
                        </div>
                      </div>

                      {/* Inclusions Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(vendor.inclusions.length > 0 ? vendor.inclusions : ['Outdoor Lawn', 'AC Banquet Hall', 'Parking']).map((inc) => (
                          <span key={inc} className="text-[10px] font-medium bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded-md">
                            {inc}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-[#E2E8F0] text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeColor}`}>
                          {statusLabel}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="p-1 text-[#94A3B8] hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Button variant="outline" size="sm">
                            <span>View Details</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Vendor Comparison & Quick Actions */}
        <div className="space-y-6">
          {/* Vendor Comparison Chart Card */}
          <Card>
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Vendor Comparison</CardTitle>
              </div>
              <span className="text-xs text-[#4F46E5] font-semibold hover:underline cursor-pointer">
                View all →
              </span>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Tabs: Price, Rating, Services */}
              <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold">
                <button
                  onClick={() => setComparisonTab('price')}
                  className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer ${
                    comparisonTab === 'price' ? 'bg-white text-[#4F46E5] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Price
                </button>
                <button
                  onClick={() => setComparisonTab('rating')}
                  className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer ${
                    comparisonTab === 'rating' ? 'bg-white text-[#4F46E5] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Rating
                </button>
                <button
                  onClick={() => setComparisonTab('services')}
                  className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer ${
                    comparisonTab === 'services' ? 'bg-white text-[#4F46E5] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Services
                </button>
              </div>

              {/* Comparison Bars - real vendor data */}
              <div className="space-y-3 text-xs">
                {vendors.length === 0 ? (
                  <p className="text-[11px] text-[#94A3B8] text-center py-4">No vendors added yet.</p>
                ) : (
                  vendors.slice(0, 4).map((v, i) => {
                    const maxAmt = Math.max(...vendors.map((x) => x.quote_amount || 0), 1);
                    const amt = v.quote_amount || 0;
                    const barPct = maxAmt > 0 ? Math.round((amt / maxAmt) * 100) : 0;
                    const colors = ['#4F46E5', '#F59E0B', '#10B981', '#0284C7'];
                    const textColors = ['text-[#4F46E5]', 'text-[#D97706]', 'text-[#059669]', 'text-[#0284C7]'];
                    return (
                      <div key={v.id}>
                        <div className="flex justify-between font-semibold mb-1">
                          <span className="text-[#0F172A] truncate max-w-[120px]">{v.name}</span>
                          <span className={textColors[i] ?? 'text-[#64748B]'}>
                            {amt > 0 ? formatMoney(amt, v.currency) : '—'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: colors[i] ?? '#94A3B8' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>

            <CardContent className="p-3.5 space-y-2">
              <div onClick={handleOpenAddModal} className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#4F46E5] transition-all bg-[#F8FAFC] flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Add New Vendor</h4>
                    <p className="text-[10px] text-[#64748B]">Search and add a new vendor</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </div>

              <div className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#4F46E5] transition-all bg-[#F8FAFC] flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FDF2F8] text-[#EC4899] flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">Compare Quotes</h4>
                    <p className="text-[10px] text-[#64748B]">Compare multiple vendor quotes</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations Banner */}
          <div className="bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] p-4 rounded-2xl border border-[#E0E7FF] space-y-3">
            <div className="flex items-center gap-2 text-[#4F46E5] font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>AI Recommendations</span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Based on your event details and budget, here are 3 more vendor suggestions for you.
            </p>
            <Button variant="primary" size="sm" className="w-full justify-center">
              <span>Get AI Suggestions</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Vendor Quote"
        maxWidth="md"
      >
        <form onSubmit={handleSaveVendor} className="space-y-4">
          <Input
            label="Vendor Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Royal Palace Hotel"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Venue', label: 'Venue' },
                { value: 'Catering', label: 'Catering' },
                { value: 'Decoration', label: 'Decoration' },
                { value: 'Photography', label: 'Photography' },
                { value: 'Entertainment', label: 'Entertainment' },
                { value: 'Makeup & Styling', label: 'Makeup & Styling' },
                { value: 'Others', label: 'Others' },
              ]}
            />
            <Input
              label="Quote Amount (₹)"
              type="number"
              value={quoteDisplay}
              onChange={(e) => setQuoteDisplay(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              options={[
                { value: 'booked', label: 'Confirmed (Booked)' },
                { value: 'quote_received', label: 'Quote Received' },
                { value: 'to_contact', label: 'To Contact' },
                { value: 'shortlisted', label: 'Shortlisted' },
              ]}
            />
            <Input
              label="Contact Info / Phone"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <Input
            label="Inclusions (comma separated)"
            value={inclusionsText}
            onChange={(e) => setInclusionsText(e.target.value)}
            placeholder="e.g. AC Banquet Hall, Parking, Stage"
          />

          <Input
            label="Exclusions / Hidden Fees"
            value={exclusionsText}
            onChange={(e) => setExclusionsText(e.target.value)}
            placeholder="e.g. Diesel fuel, taxes, cleanup"
          />

          <div className="flex justify-between pt-3 border-t border-[#E2E8F0]">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Save Vendor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
