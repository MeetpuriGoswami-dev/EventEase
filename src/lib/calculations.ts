import { BudgetItem, BudgetSummary, StressTestScenarioResult, StressTestItemResult } from '@/types';

/**
 * Calculates budget summary metrics deterministically in integer minor units.
 * Never uses floating point math for accumulation.
 */
export function calculateBudgetSummary(
  totalBudget: number,
  items: BudgetItem[]
): BudgetSummary {
  let plannedTotal = 0;
  let paidTotal = 0;
  let projectedTotal = 0;
  let outstandingTotal = 0;

  for (const item of items) {
    const planned = Math.round(item.planned_amount || 0);
    const paid = Math.round(item.paid_amount || 0);
    
    // Projected uses actual if available, else quoted if available, else planned
    const projected = Math.round(
      item.actual_amount !== null && item.actual_amount !== undefined
        ? item.actual_amount
        : item.quoted_amount !== null && item.quoted_amount !== undefined
        ? item.quoted_amount
        : planned
    );

    // Outstanding cannot be negative per item
    const outstanding = Math.max(0, projected - paid);

    plannedTotal += planned;
    paidTotal += paid;
    projectedTotal += projected;
    outstandingTotal += outstanding;
  }

  const budgetVariance = totalBudget - projectedTotal;
  const isOverBudget = budgetVariance < 0;
  const budgetUsagePercent = totalBudget > 0 
    ? Math.round((projectedTotal / totalBudget) * 1000) / 10 
    : 0;

  return {
    totalBudget,
    plannedTotal,
    projectedTotal,
    paidTotal,
    outstandingTotal,
    budgetVariance,
    budgetUsagePercent,
    isOverBudget,
  };
}

/**
 * Formats integer minor units into display currency.
 * For INR, uses Indian number format (₹2,50,000) with no decimal places.
 * For other currencies, uses standard international format with 2 decimal places.
 */
export function formatMoney(amountMinorUnits: number, currency = 'USD'): string {
  const isNegative = amountMinorUnits < 0;
  const absAmount = Math.abs(amountMinorUnits) / 100;
  const upperCurrency = currency.toUpperCase();

  try {
    if (upperCurrency === 'INR') {
      // Use Indian locale for lakhs/crore grouping, no fraction digits
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(absAmount);
      return isNegative ? `-${formatted}` : formatted;
    }

    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: upperCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absAmount);

    return isNegative ? `-${formatted}` : formatted;
  } catch {
    const prefix = upperCurrency === 'INR' ? '₹' : '$';
    const num = upperCurrency === 'INR'
      ? absAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return isNegative ? `-${prefix}${num}` : `${prefix}${num}`;
  }
}

/**
 * Parses user input decimal currency into integer minor units (e.g. "150.50" -> 15050)
 */
export function parseToMinorUnits(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Calculates due date based on an event date and days before event.
 * If daysBeforeEvent is 0, due date is the event date.
 * If calculated due date is in the past, marks as overdue without mutating original date.
 */
export function calculateDueDate(eventDateStr: string, daysBeforeEvent: number): {
  dueDate: string;
  isPast: boolean;
  daysRemaining: number;
} {
  const eventDate = new Date(`${eventDateStr}T00:00:00`);
  const dueDateTime = new Date(eventDate.getTime() - daysBeforeEvent * 24 * 60 * 60 * 1000);
  
  const yyyy = dueDateTime.getFullYear();
  const mm = String(dueDateTime.getMonth() + 1).padStart(2, '0');
  const dd = String(dueDateTime.getDate()).padStart(2, '0');
  const dueDate = `${yyyy}-${mm}-${dd}`;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = dueDateTime.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    dueDate,
    isPast: daysRemaining < 0,
    daysRemaining,
  };
}

/**
 * Computes countdown days until the event
 */
export function getDaysUntilEvent(eventDateStr: string): number {
  const eventDate = new Date(`${eventDateStr}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = eventDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates the Plan Stress Test scenario based strictly on user-entered data.
 * If an item lacks a unit cost, it is flagged as uncalculated rather than fabricated.
 */
export function evaluateStressTest(
  totalBudget: number,
  originalGuestCount: number,
  scenarioGuestCount: number,
  items: BudgetItem[]
): StressTestScenarioResult {
  const baseSummary = calculateBudgetSummary(totalBudget, items);
  const guestCountDelta = scenarioGuestCount - originalGuestCount;

  let scenarioProjectedTotal = 0;
  let uncalculatedItemsCount = 0;
  const itemBreakdown: StressTestItemResult[] = [];
  const drivers: { category: string; impactAmount: number; explanation: string }[] = [];

  for (const item of items) {
    const originalProjected = Math.round(
      item.actual_amount !== null && item.actual_amount !== undefined
        ? item.actual_amount
        : item.quoted_amount !== null && item.quoted_amount !== undefined
        ? item.quoted_amount
        : item.planned_amount || 0
    );

    // Check if user entered a per-guest unit cost for this item
    if (item.unit_cost_per_guest && item.unit_cost_per_guest > 0) {
      // Scenario cost = base cost for other elements or scaled by guest count
      const scenarioCost = Math.round(scenarioGuestCount * item.unit_cost_per_guest);
      const diff = scenarioCost - originalProjected;

      scenarioProjectedTotal += scenarioCost;
      itemBreakdown.push({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        originalAmount: originalProjected,
        scenarioAmount: scenarioCost,
        difference: diff,
        unitCostPerGuest: item.unit_cost_per_guest,
        isCalculated: true,
      });

      if (diff !== 0) {
        drivers.push({
          category: item.category,
          impactAmount: Math.abs(diff),
          explanation: `${item.name} fluctuates with guests at ${formatMoney(item.unit_cost_per_guest)}/guest (${diff > 0 ? '+' : ''}${formatMoney(diff)})`,
        });
      }
    } else {
      // Fixed cost or missing unit cost - keep unchanged
      scenarioProjectedTotal += originalProjected;
      uncalculatedItemsCount++;
      itemBreakdown.push({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        originalAmount: originalProjected,
        scenarioAmount: originalProjected,
        difference: 0,
        unitCostPerGuest: null,
        isCalculated: false,
      });
    }
  }

  // Sort drivers by highest impact
  drivers.sort((a, b) => b.impactAmount - a.impactAmount);

  const projectedTotalDelta = scenarioProjectedTotal - baseSummary.projectedTotal;
  const scenarioVariance = totalBudget - scenarioProjectedTotal;
  const isScenarioOverBudget = scenarioVariance < 0;

  const qualitativeRisks: string[] = [];
  if (guestCountDelta > 0) {
    qualitativeRisks.push(`Guest increase of +${guestCountDelta} may impact venue fire capacity, table arrangements, and bar queues.`);
    if (uncalculatedItemsCount > 0) {
      qualitativeRisks.push(`${uncalculatedItemsCount} budget items do not have per-guest unit costs configured. Their impact is not included above.`);
    }
  } else if (guestCountDelta < 0) {
    qualitativeRisks.push(`Guest reduction of ${guestCountDelta} may be subject to minimum food and beverage spending commits or venue minimum guest thresholds.`);
  }

  return {
    originalGuestCount,
    scenarioGuestCount,
    guestCountDelta,
    originalProjectedTotal: baseSummary.projectedTotal,
    scenarioProjectedTotal,
    projectedTotalDelta,
    totalBudget,
    scenarioVariance,
    isScenarioOverBudget,
    itemBreakdown,
    uncalculatedItemsCount,
    largestCostDrivers: drivers.slice(0, 3),
    qualitativeRisks,
  };
}
