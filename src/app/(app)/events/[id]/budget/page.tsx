'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BudgetItem, Event } from '@/types';
import {
  calculateBudgetSummary,
  formatMoney,
  parseToMinorUnits,
} from '@/lib/calculations';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  Wallet,
  Zap,
  TrendingUp,
  CreditCard,
  Lightbulb,
  Check,
  ChevronRight,
  ArrowRight,
  Edit2,
  Trash2,
  CalendarDays,
  Store,
  Layers,
} from 'lucide-react';

export default function BudgetPage() {
  const { id: eventId } = useParams() as { id: string };
  const [event, setEvent] = useState<Event | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Venue');
  const [plannedDisplay, setPlannedDisplay] = useState('80000');
  const [actualDisplay, setActualDisplay] = useState('42000');
  const [unitCostDisplay, setUnitCostDisplay] = useState('450');
  const [notes, setNotes] = useState('');

  const fetchBudgetData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
        setBudgetItems(data.budgetItems || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [eventId]);

  const currency = event?.currency || 'INR';
  const totalBudget = event?.total_budget || 0;
  const summary = calculateBudgetSummary(totalBudget, budgetItems);

  const spentPercentage = totalBudget > 0 ? Math.min(100, Math.round((summary.paidTotal / totalBudget) * 100)) : 0;
  const remainingPercentage = Math.max(0, 100 - spentPercentage);

  // Group budget items dynamically by category for real breakdown
  const categoryTotals = budgetItems.reduce<Record<string, { planned: number; paid: number }>>((acc, item) => {
    const cat = item.category || 'Others';
    if (!acc[cat]) acc[cat] = { planned: 0, paid: 0 };
    acc[cat].planned += item.planned_amount || 0;
    acc[cat].paid += item.paid_amount || 0;
    return acc;
  }, {});

  const categoryEntries = Object.entries(categoryTotals);
  const totalPlannedSum = categoryEntries.reduce((s, [, v]) => s + v.planned, 0) || totalBudget || 1;
  const categoryColors = ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#0284C7', '#8B5CF6', '#14B8A6', '#64748B'];

  // Calculate dynamic SVG donut circle segments
  const CIRCUMFERENCE = 238.76;
  let cumulativeOffset = 0;
  const donutSegments = categoryEntries.map(([cat, val], i) => {
    const fraction = totalPlannedSum > 0 ? val.planned / totalPlannedSum : 0;
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

  // Real paid transactions
  const paidTransactions = budgetItems.filter((item) => (item.paid_amount || 0) > 0);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Venue');
    setPlannedDisplay('50000');
    setActualDisplay('0');
    setUnitCostDisplay('');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: BudgetItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPlannedDisplay((item.planned_amount / 100).toFixed(0));
    setActualDisplay((item.paid_amount / 100).toFixed(0));
    setUnitCostDisplay(item.unit_cost_per_guest ? (item.unit_cost_per_guest / 100).toFixed(0) : '');
    setNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const plannedMinor = parseToMinorUnits(plannedDisplay);
      const paidMinor = parseToMinorUnits(actualDisplay);
      const unitCostMinor = unitCostDisplay ? parseToMinorUnits(unitCostDisplay) : null;

      if (editingItem) {
        const res = await fetch(`/api/budget-items/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category,
            planned_amount: plannedMinor,
            paid_amount: paidMinor,
            unit_cost_per_guest: unitCostMinor,
            notes,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setBudgetItems((prev) => prev.map((i) => (i.id === editingItem.id ? data.item : i)));
          setModalOpen(false);
        }
      } else {
        const res = await fetch(`/api/events/${eventId}/budget-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category,
            planned_amount: plannedMinor,
            paid_amount: paidMinor,
            unit_cost_per_guest: unitCostMinor,
            notes,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setBudgetItems((prev) => [...prev, data.item]);
          setModalOpen(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this line item?')) return;
    try {
      const res = await fetch(`/api/budget-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBudgetItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Grid: Left Content (2 cols) & Right Sidebar (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Budget Overview</CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/events/${eventId}/stress-test`}>
                  <Button variant="secondary" size="sm">
                    <Zap className="w-3.5 h-3.5 mr-1" />
                    <span>Plan Stress Test</span>
                  </Button>
                </Link>
                <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Item</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Dynamic Donut Chart */}
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
                      {formatMoney(totalBudget, currency)}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">Total Budget</span>
                  </div>
                </div>

                {/* Categories Breakdown - Calculated dynamically */}
                <div className="space-y-2 flex-1 w-full text-xs">
                  {categoryEntries.length === 0 ? (
                    <p className="text-[11px] text-[#94A3B8] text-center py-4">No budget categories yet. Click &quot;Add Item&quot; to begin.</p>
                  ) : (
                    categoryEntries.map(([cat, val], i) => {
                      const pct = Math.round((val.planned / totalPlannedSum) * 100);
                      return (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[i % categoryColors.length] }} />
                            {cat}
                          </span>
                          <span className="text-[#64748B]">{pct}%</span>
                          <span className="font-bold text-[#0F172A]">{formatMoney(val.planned, currency)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Spent vs Remaining Dual Progress Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B] font-semibold">Spent So Far</span>
                    <span className="font-bold text-[#0F172A]">{formatMoney(summary.paidTotal, currency)}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${spentPercentage}%` }} />
                  </div>
                  <div className="text-right text-[11px] text-[#94A3B8]">{spentPercentage}%</div>
                </div>

                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B] font-semibold">Remaining Budget</span>
                    <span className="font-bold text-[#10B981]">{formatMoney(Math.max(0, summary.budgetVariance), currency)}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${remainingPercentage}%` }} />
                  </div>
                  <div className="text-right text-[11px] text-[#059669] font-medium">{remainingPercentage}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category-wise Budget Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Category-wise Budget</CardTitle>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#94A3B8] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Planned Budget</th>
                    <th className="py-3 px-4 text-right">Spent</th>
                    <th className="py-3 px-4 text-right">Remaining</th>
                    <th className="py-3 px-4 text-center">Progress</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {budgetItems.map((item) => {
                    const spent = item.paid_amount || 0;
                    const planned = item.planned_amount || 1;
                    const remaining = Math.max(0, planned - spent);
                    const pct = Math.min(100, Math.round((spent / planned) * 100));
                    const isWatch = pct > 70;

                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#0F172A] block">{item.name}</span>
                          <span className="text-[10px] text-[#64748B]">{item.category}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-[#0F172A]">
                          {formatMoney(planned, currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#4F46E5] font-semibold">
                          {formatMoney(spent, currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#10B981] font-semibold">
                          {formatMoney(remaining, currency)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isWatch ? 'bg-[#F59E0B]' : 'bg-[#4F46E5]'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[#64748B] font-mono">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isWatch
                              ? 'bg-[#FEF3C7] text-[#D97706]'
                              : 'bg-[#ECFDF5] text-[#059669]'
                          }`}>
                            {isWatch ? 'Watch' : 'On Track'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1 text-[#94A3B8] hover:text-[#0F172A]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-[#94A3B8] hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Transactions & AI Insights */}
        <div className="space-y-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Recent Transactions</CardTitle>
              </div>
              <span className="text-xs text-[#4F46E5] font-semibold hover:underline cursor-pointer">
                View all →
              </span>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5 text-xs">
              {paidTransactions.length === 0 ? (
                <div className="text-center py-6 text-[#94A3B8]">
                  <p className="text-[11px]">No payments recorded yet.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Record actual spent amount when editing an item.</p>
                </div>
              ) : (
                paidTransactions.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center font-bold">
                        ✓
                      </div>
                      <div>
                        <h5 className="font-bold text-[#0F172A] truncate max-w-[140px]">{item.name}</h5>
                        <p className="text-[10px] text-[#64748B]">{item.category}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#0F172A]">{formatMoney(item.paid_amount || 0, currency)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Budget Insights */}
          <Card className="bg-gradient-to-br from-[#EEF2FF]/60 to-[#F5F3FF]/60 border-[#C7D2FE]">
            <CardHeader className="border-b border-[#E0E7FF]">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">AI Budget Insights</CardTitle>
              </div>
              <span className="text-xs text-[#4F46E5] font-semibold hover:underline cursor-pointer">
                View all →
              </span>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#4F46E5]">Smart Suggestions</span>
                <p className="text-[11px] text-[#64748B]">
                  Based on your current budget and spending pattern, here are some actionable tips:
                </p>
              </div>

              <ul className="space-y-2 text-[#0F172A] text-xs">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Consider off-peak dates to save 10–15% on venue costs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Explore combo packages for food &amp; decor vendors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Save up to ₹8,000 by choosing verified local photographers.</span>
                </li>
              </ul>

              <div className="pt-2">
                <Link href={`/events/${eventId}/stress-test`} className="block">
                  <Button variant="primary" size="sm" className="w-full">
                    <span>Run Plan Stress Test</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <Input
            label="Item Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Venue Booking"
          />

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'Venue', label: 'Venue' },
              { value: 'Decoration', label: 'Decoration' },
              { value: 'Food & Beverages', label: 'Food & Beverages' },
              { value: 'Photography', label: 'Photography' },
              { value: 'Others', label: 'Others' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Planned Budget (₹)"
              type="number"
              required
              value={plannedDisplay}
              onChange={(e) => setPlannedDisplay(e.target.value)}
            />
            <Input
              label="Spent So Far (₹)"
              type="number"
              value={actualDisplay}
              onChange={(e) => setActualDisplay(e.target.value)}
            />
          </div>

          <Input
            label="Per-Guest Unit Cost (₹) — For Stress Test"
            type="number"
            value={unitCostDisplay}
            onChange={(e) => setUnitCostDisplay(e.target.value)}
            hint="Optional: e.g. 450/guest for catering. Powers the scenario simulation."
          />

          <Textarea
            label="Notes / Vendor reference"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-between pt-3 border-t border-[#E2E8F0]">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Save Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
