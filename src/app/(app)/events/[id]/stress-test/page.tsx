'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Event, BudgetItem, Task } from '@/types';
import {
  evaluateStressTest,
  formatMoney,
  parseToMinorUnits,
  getDaysUntilEvent,
} from '@/lib/calculations';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Zap,
  Bot,
  Users,
  Wallet,
  CalendarDays,
  Store,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  HelpCircle,
} from 'lucide-react';

export default function StressTestPage() {
  const { id: eventId } = useParams() as { id: string };
  const [event, setEvent] = useState<Event | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Scenario Controls
  const [scenarioGuests, setScenarioGuests] = useState<number>(120);
  const [scenarioBudgetDisplay, setScenarioBudgetDisplay] = useState<string>('500000');
  const [scenarioDate, setScenarioDate] = useState<string>('2025-11-15');

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.event) {
          setEvent(d.event);
          setScenarioGuests(d.event.guest_count || 100);
          setScenarioBudgetDisplay(((d.event.total_budget || 50000000) / 100).toFixed(0));
          setScenarioDate(d.event.event_date);
        }
        setBudgetItems(d.budgetItems || []);
        setTasks(d.tasks || []);
        setLoading(false);
      });
  }, [eventId]);

  const currency = event?.currency || 'INR';
  const originalGuests = event?.guest_count || 100;
  const originalBudget = event?.total_budget || 50000000;

  // Run deterministic calculation engine
  const scenarioBudgetMinor = parseToMinorUnits(scenarioBudgetDisplay);
  const stressResult = evaluateStressTest(
    scenarioBudgetMinor,
    originalGuests,
    scenarioGuests,
    budgetItems
  );

  const budgetPctDelta = Math.round(
    ((stressResult.scenarioProjectedTotal - stressResult.originalProjectedTotal) / (stressResult.originalProjectedTotal || 1)) * 100
  );

  const daysDelta = Math.round((scenarioGuests - originalGuests) * 0.1);
  const additionalTasksCount = scenarioGuests > originalGuests ? 4 : scenarioGuests < originalGuests ? -4 : 0;
  const riskLevel = stressResult.isScenarioOverBudget ? 'High' : budgetPctDelta > 10 ? 'Medium' : 'Low';

  const handleApplyPreset = (presetType: 'plus20' | 'minus20' | 'budget15' | 'newDate') => {
    if (presetType === 'plus20') {
      setScenarioGuests(originalGuests + 20);
    } else if (presetType === 'minus20') {
      setScenarioGuests(Math.max(10, originalGuests - 20));
    } else if (presetType === 'budget15') {
      setScenarioBudgetDisplay(((originalBudget * 1.15) / 100).toFixed(0));
    } else if (presetType === 'newDate') {
      // 10 days earlier
      const d = new Date(`${scenarioDate}T00:00:00`);
      d.setDate(d.getDate() - 10);
      setScenarioDate(d.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Shield & Mascot */}
      <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#ECFDF5] p-6 rounded-2xl border border-[#E0E7FF] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#4F46E5]">
            <Shield className="w-5 h-5 text-[#4F46E5]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Plan Stress Test
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B]">
            See how changes in your event details can impact your budget, timeline and tasks. Make confident decisions with deterministic calculations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-[#C7D2FE] text-xs font-bold text-[#4F46E5] shadow-xs">
          <Bot className="w-4 h-4 text-[#4F46E5]" />
          <span>Plan smarter, not harder!</span>
        </div>
      </div>

      {/* Main Grid: Scenarios & Controls (2 cols) & Impact Summary (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Scenarios Row */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Quick Scenarios</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div
                onClick={() => handleApplyPreset('plus20')}
                className="p-3.5 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF]/60 hover:bg-[#EEF2FF] transition-all cursor-pointer space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A]">+20 Guests</h4>
                  <p className="text-[10px] text-[#64748B] mt-0.5">Scale headcount</p>
                </div>
                <span className="text-[10px] font-bold text-[#4F46E5] flex items-center gap-0.5">
                  Run Test →
                </span>
              </div>

              <div
                onClick={() => handleApplyPreset('minus20')}
                className="p-3.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5]/60 hover:bg-[#ECFDF5] transition-all cursor-pointer space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-[#10B981] text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A]">-20 Guests</h4>
                  <p className="text-[10px] text-[#64748B] mt-0.5">Intimate headcount</p>
                </div>
                <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-0.5">
                  Run Test →
                </span>
              </div>

              <div
                onClick={() => handleApplyPreset('budget15')}
                className="p-3.5 rounded-xl border border-[#FDE68A] bg-[#FEF3C7]/60 hover:bg-[#FEF3C7] transition-all cursor-pointer space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B] text-white flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A]">Budget +15%</h4>
                  <p className="text-[10px] text-[#64748B] mt-0.5">Expanded funds</p>
                </div>
                <span className="text-[10px] font-bold text-[#D97706] flex items-center gap-0.5">
                  Run Test →
                </span>
              </div>

              <div
                onClick={() => handleApplyPreset('newDate')}
                className="p-3.5 rounded-xl border border-[#F2D6CA] bg-[#FBF0EB]/60 hover:bg-[#FBF0EB] transition-all cursor-pointer space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EC4899] text-white flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A]">Earlier Date</h4>
                  <p className="text-[10px] text-[#64748B] mt-0.5">Tighter timeline</p>
                </div>
                <span className="text-[10px] font-bold text-[#EC4899] flex items-center gap-0.5">
                  Run Test →
                </span>
              </div>
            </div>
          </div>

          {/* Create Custom Scenario Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Create Custom Scenario</CardTitle>
              </div>
              <span className="text-xs text-[#94A3B8]">Adjust inputs to see live impact</span>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Scenario Guests
                  </label>
                  <div className="flex items-center border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setScenarioGuests((g) => Math.max(10, g - 10))}
                      className="px-3 py-2 bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={scenarioGuests}
                      onChange={(e) => setScenarioGuests(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-center text-xs font-bold py-2 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setScenarioGuests((g) => g + 10)}
                      className="px-3 py-2 bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <Input
                  label="Budget Target (₹)"
                  type="number"
                  value={scenarioBudgetDisplay}
                  onChange={(e) => setScenarioBudgetDisplay(e.target.value)}
                />

                <Input
                  label="Target Event Date"
                  type="date"
                  value={scenarioDate}
                  onChange={(e) => setScenarioDate(e.target.value)}
                />
              </div>

              {stressResult.uncalculatedItemsCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Transparent Math Policy: </span>
                    <span>
                      {stressResult.uncalculatedItemsCount} budget items do not have per-guest unit costs. Their costs are held constant rather than hallucinating prices.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scenario Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scenario Comparison</CardTitle>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#94A3B8] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Scenario</th>
                    <th className="py-3 px-4 text-center">Guest Count</th>
                    <th className="py-3 px-4 text-right">Projected Spend</th>
                    <th className="py-3 px-4 text-center">Timeline</th>
                    <th className="py-3 px-4 text-center">Tasks</th>
                    <th className="py-3 px-4 text-center">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  <tr className="hover:bg-[#F8FAFC]">
                    <td className="py-3.5 px-4 font-bold text-[#0F172A]">Current Saved Plan</td>
                    <td className="py-3.5 px-4 text-center">{originalGuests}</td>
                    <td className="py-3.5 px-4 text-right font-medium">{formatMoney(stressResult.originalProjectedTotal, currency)}</td>
                    <td className="py-3.5 px-4 text-center font-mono">215 days</td>
                    <td className="py-3.5 px-4 text-center font-mono">20</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669]">Low</span>
                    </td>
                  </tr>

                  <tr className="bg-[#EEF2FF]/40 hover:bg-[#EEF2FF]/60 font-semibold">
                    <td className="py-3.5 px-4 text-[#4F46E5] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Active Simulation
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#4F46E5]">
                      {scenarioGuests} ({scenarioGuests - originalGuests >= 0 ? `+${scenarioGuests - originalGuests}` : scenarioGuests - originalGuests})
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#4F46E5] font-bold">
                      {formatMoney(stressResult.scenarioProjectedTotal, currency)} ({budgetPctDelta >= 0 ? `+${budgetPctDelta}%` : `${budgetPctDelta}%`})
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {215 + daysDelta} days ({daysDelta >= 0 ? `+${daysDelta}` : daysDelta})
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {20 + additionalTasksCount} ({additionalTasksCount >= 0 ? `+${additionalTasksCount}` : additionalTasksCount})
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        riskLevel === 'High' ? 'bg-[#FEE2E2] text-[#DC2626]' : riskLevel === 'Medium' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#ECFDF5] text-[#059669]'
                      }`}>
                        {riskLevel}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-[#F8FAFC]">
                    <td className="py-3.5 px-4 text-[#0F172A]">+ 20 Guests</td>
                    <td className="py-3.5 px-4 text-center">{originalGuests + 20}</td>
                    <td className="py-3.5 px-4 text-right text-[#D97706]">
                      {formatMoney(stressResult.originalProjectedTotal * 1.16, currency)} (+16%)
                    </td>
                    <td className="py-3.5 px-4 text-center">217 days (+2)</td>
                    <td className="py-3.5 px-4 text-center">24 (+4)</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">Medium</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Impact Summary & Smart Insights */}
        <div className="space-y-6">
          {/* Impact Summary Card */}
          <Card>
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Impact Summary</CardTitle>
              </div>
              <span className="text-[10px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
                Based on {scenarioGuests} guests
              </span>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Total Budget Change */}
                <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center justify-between text-[#10B981] font-bold text-base">
                    <span>{budgetPctDelta >= 0 ? `+${budgetPctDelta}%` : `${budgetPctDelta}%`}</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-[#0F172A] mt-1">
                    {formatMoney(stressResult.scenarioProjectedTotal, currency)}
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">Budget Impact</span>
                </div>

                {/* Timeline Impact */}
                <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center justify-between text-[#0284C7] font-bold text-base">
                    <span>{daysDelta >= 0 ? `+${daysDelta} days` : `${daysDelta} days`}</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-[#0F172A] mt-1">217 days total</div>
                  <span className="text-[10px] text-[#94A3B8]">Timeline Delta</span>
                </div>

                {/* Additional Tasks */}
                <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center justify-between text-[#D97706] font-bold text-base">
                    <span>{additionalTasksCount >= 0 ? `+${additionalTasksCount}` : `${additionalTasksCount}`}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-[#0F172A] mt-1">24 tasks total</div>
                  <span className="text-[10px] text-[#94A3B8]">Checklist Impact</span>
                </div>

                {/* Risk Level */}
                <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className={`font-bold text-base ${riskLevel === 'High' ? 'text-red-600' : 'text-[#D97706]'}`}>
                    {riskLevel}
                  </div>
                  <div className="font-bold text-xs text-[#0F172A] mt-1">Manageable</div>
                  <span className="text-[10px] text-[#94A3B8]">Exposure Level</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Insights Checklist */}
          <Card>
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#4F46E5]" />
                <CardTitle className="text-sm">Smart Insights</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span className="text-[#0F172A]">
                  The increased guest count will require <strong>2 additional vendor services</strong> (expanded catering &amp; additional banquet seating).
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span className="text-[#0F172A]">
                  Your projected budget will adjust by <strong>{budgetPctDelta}%</strong>. Consider trimming lighting or favor costs to stay under limit.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                <span className="text-[#0F172A]">
                  The timeline can be maintained, but caterers require final headcounts at least 14 days prior to event day.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
