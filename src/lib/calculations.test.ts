import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
  formatMoney,
  parseToMinorUnits,
  calculateDueDate,
  evaluateStressTest,
} from './calculations';
import { BudgetItem } from '@/types';

describe('calculateBudgetSummary', () => {
  it('handles empty budget items cleanly', () => {
    const summary = calculateBudgetSummary(500000, []);
    expect(summary.totalBudget).toBe(500000);
    expect(summary.plannedTotal).toBe(0);
    expect(summary.projectedTotal).toBe(0);
    expect(summary.paidTotal).toBe(0);
    expect(summary.outstandingTotal).toBe(0);
    expect(summary.budgetVariance).toBe(500000);
    expect(summary.budgetUsagePercent).toBe(0);
    expect(summary.isOverBudget).toBe(false);
  });

  it('handles zero budget gracefully without division by zero', () => {
    const summary = calculateBudgetSummary(0, [
      {
        id: '1',
        event_id: 'e1',
        name: 'Flowers',
        category: 'Decor',
        planned_amount: 50000,
        paid_amount: 10000,
        created_at: '',
        updated_at: '',
      },
    ]);
    expect(summary.budgetUsagePercent).toBe(0);
    expect(summary.budgetVariance).toBe(-50000);
    expect(summary.isOverBudget).toBe(true);
  });

  it('calculates projected using precedence: actual > quoted > planned', () => {
    const items: BudgetItem[] = [
      {
        id: '1',
        event_id: 'e1',
        name: 'Venue',
        category: 'Venue',
        planned_amount: 100000,
        quoted_amount: 120000,
        actual_amount: 115000, // Should take actual (115000)
        paid_amount: 50000,
        created_at: '',
        updated_at: '',
      },
      {
        id: '2',
        event_id: 'e1',
        name: 'DJ',
        category: 'Music',
        planned_amount: 30000,
        quoted_amount: 35000, // Should take quoted (35000)
        actual_amount: null,
        paid_amount: 10000,
        created_at: '',
        updated_at: '',
      },
      {
        id: '3',
        event_id: 'e1',
        name: 'Cake',
        category: 'Food',
        planned_amount: 15000, // Should take planned (15000)
        quoted_amount: null,
        actual_amount: null,
        paid_amount: 0,
        created_at: '',
        updated_at: '',
      },
    ];

    const summary = calculateBudgetSummary(200000, items);
    // 115000 + 35000 + 15000 = 165000
    expect(summary.projectedTotal).toBe(165000);
    // 100000 + 30000 + 15000 = 145000
    expect(summary.plannedTotal).toBe(145000);
    // 50000 + 10000 + 0 = 60000
    expect(summary.paidTotal).toBe(60000);
    // (115000-50000) + (35000-10000) + (15000-0) = 65000 + 25000 + 15000 = 105000
    expect(summary.outstandingTotal).toBe(105000);
    // 200000 - 165000 = 35000
    expect(summary.budgetVariance).toBe(35000);
    expect(summary.isOverBudget).toBe(false);
  });

  it('correctly reports overspend with negative variance without silent clamping', () => {
    const items: BudgetItem[] = [
      {
        id: '1',
        event_id: 'e1',
        name: 'Catering',
        category: 'Food',
        planned_amount: 100000,
        quoted_amount: 150000,
        paid_amount: 80000,
        created_at: '',
        updated_at: '',
      },
    ];

    const summary = calculateBudgetSummary(120000, items);
    expect(summary.projectedTotal).toBe(150000);
    expect(summary.budgetVariance).toBe(-30000);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.budgetUsagePercent).toBe(125);
  });
});

describe('formatMoney and parseToMinorUnits', () => {
  it('converts minor units to formatted currency strings', () => {
    expect(formatMoney(125050, 'USD')).toBe('$1,250.50');
    expect(formatMoney(0, 'USD')).toBe('$0.00');
    expect(formatMoney(-5000, 'USD')).toBe('-$50.00');
  });

  it('parses user input numbers into integer minor units', () => {
    expect(parseToMinorUnits('1250.50')).toBe(125050);
    expect(parseToMinorUnits('$500')).toBe(50000);
    expect(parseToMinorUnits(75.25)).toBe(7525);
    expect(parseToMinorUnits('invalid')).toBe(0);
  });
});

describe('calculateDueDate', () => {
  it('calculates due date from event date and days before event', () => {
    const res = calculateDueDate('2026-12-25', 10);
    expect(res.dueDate).toBe('2026-12-15');
  });
});

describe('evaluateStressTest', () => {
  const items: BudgetItem[] = [
    {
      id: 'b1',
      event_id: 'e1',
      name: 'Buffet Catering',
      category: 'Catering',
      planned_amount: 500000, // $5,000 for 100 guests = $50/guest
      unit_cost_per_guest: 5000, // $50.00 in minor units
      paid_amount: 0,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'b2',
      event_id: 'e1',
      name: 'Photographer',
      category: 'Photography',
      planned_amount: 200000, // Fixed $2,000 cost, no per-guest unit cost
      unit_cost_per_guest: null,
      paid_amount: 0,
      created_at: '',
      updated_at: '',
    },
  ];

  it('scales items with known unit cost and keeps fixed items unchanged', () => {
    // Original: 100 guests -> Catering $5,000 + Photo $2,000 = $7,000
    // Scenario: 130 guests -> Catering 130 * $50 = $6,500 + Photo $2,000 = $8,500
    const result = evaluateStressTest(800000, 100, 130, items);

    expect(result.originalGuestCount).toBe(100);
    expect(result.scenarioGuestCount).toBe(130);
    expect(result.guestCountDelta).toBe(30);
    expect(result.originalProjectedTotal).toBe(700000);
    expect(result.scenarioProjectedTotal).toBe(850000);
    expect(result.projectedTotalDelta).toBe(150000);
    expect(result.scenarioVariance).toBe(-50000); // 800,000 - 850,000
    expect(result.isScenarioOverBudget).toBe(true);
    expect(result.uncalculatedItemsCount).toBe(1); // Photographer has no unit cost
  });

  it('identifies uncalculated items explicitly without fabricating numbers', () => {
    const unscaledItems: BudgetItem[] = [
      {
        id: 'b1',
        event_id: 'e1',
        name: 'Hall Rental',
        category: 'Venue',
        planned_amount: 300000,
        unit_cost_per_guest: null,
        paid_amount: 0,
        created_at: '',
        updated_at: '',
      },
    ];

    const result = evaluateStressTest(500000, 50, 80, unscaledItems);
    expect(result.projectedTotalDelta).toBe(0);
    expect(result.uncalculatedItemsCount).toBe(1);
    expect(result.itemBreakdown[0].isCalculated).toBe(false);
  });
});
