export type EventType = 'wedding' | 'birthday' | 'community';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskCreator = 'ai' | 'user';

export type VendorStatus = 
  | 'to_contact' 
  | 'contacted' 
  | 'quote_received' 
  | 'shortlisted' 
  | 'booked' 
  | 'not_selected';

export interface EventPreferences {
  style?: string;
  theme?: string;
  dietaryNeeds?: string[];
  accessibilityNeeds?: string[];
  culturalPreferences?: string[];
  venueConstraints?: string;
  mustHaves?: string[];
  additionalNotes?: string;
}

export interface Event {
  id: string;
  owner_id: string;
  name: string;
  event_type: EventType;
  event_date: string; // ISO date string (YYYY-MM-DD)
  city?: string | null;
  currency: string;
  guest_count?: number | null;
  description?: string | null;
  total_budget: number; // Integer minor units (e.g. cents/paise)
  preferences: EventPreferences;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  event_id: string;
  title: string;
  description: string;
  category: string;
  due_date: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  assignee_label?: string | null;
  created_by: TaskCreator;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  event_id: string;
  name: string;
  category: string;
  planned_amount: number; // minor units
  quoted_amount?: number | null;
  actual_amount?: number | null;
  paid_amount: number;
  vendor_id?: string | null;
  notes?: string | null;
  unit_cost_per_guest?: number | null; // For stress testing
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  event_id: string;
  name: string;
  category: string;
  contact?: string | null;
  status: VendorStatus;
  quote_amount?: number | null;
  currency: string;
  inclusions: string[];
  exclusions: string[];
  advance_amount?: number | null;
  balance_due_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// AI Plan Draft Types
export interface PlanDraftBudgetCategory {
  name: string;
  percentage: number;
  reason: string;
}

export interface PlanDraftTask {
  title: string;
  description: string;
  category: string;
  daysBeforeEvent: number;
  priority: TaskPriority;
}

export interface PlanDraftIdea {
  title: string;
  description: string;
  reasonItFits: string;
  category: string;
}

export interface PlanDraftRisk {
  title: string;
  reason: string;
  suggestedAction: string;
  severity: TaskPriority;
}

export interface PlanDraft {
  summary: string;
  assumptions: string[];
  budgetCategories: PlanDraftBudgetCategory[];
  tasks: PlanDraftTask[];
  ideas: PlanDraftIdea[];
  risks: PlanDraftRisk[];
}

// Calculation and Summary Interfaces
export interface BudgetSummary {
  totalBudget: number;
  plannedTotal: number;
  projectedTotal: number;
  paidTotal: number;
  outstandingTotal: number;
  budgetVariance: number; // positive = under budget, negative = projected overspend
  budgetUsagePercent: number;
  isOverBudget: boolean;
}

export interface StressTestItemResult {
  itemId: string;
  itemName: string;
  category: string;
  originalAmount: number;
  scenarioAmount: number;
  difference: number;
  unitCostPerGuest?: number | null;
  isCalculated: boolean;
}

export interface StressTestScenarioResult {
  originalGuestCount: number;
  scenarioGuestCount: number;
  guestCountDelta: number;
  originalProjectedTotal: number;
  scenarioProjectedTotal: number;
  projectedTotalDelta: number;
  totalBudget: number;
  scenarioVariance: number;
  isScenarioOverBudget: boolean;
  itemBreakdown: StressTestItemResult[];
  uncalculatedItemsCount: number;
  largestCostDrivers: {
    category: string;
    impactAmount: number;
    explanation: string;
  }[];
  qualitativeRisks: string[];
}
