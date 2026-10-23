import { z } from 'zod';
import { PlanDraft } from '@/types';

export const TaskPriorityEnum = z.enum(['high', 'medium', 'low']);

export const PlanDraftBudgetCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  percentage: z.number().min(0).max(100),
  reason: z.string().min(1).max(200),
});

export const PlanDraftTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(120),
  description: z.string().max(500).default(''),
  category: z.string().min(1).max(50).default('General'),
  daysBeforeEvent: z.number().int().min(0).max(730), // up to 2 years in advance
  priority: TaskPriorityEnum.default('medium'),
});

export const PlanDraftIdeaSchema = z.object({
  title: z.string().min(1, 'Idea title is required').max(100),
  description: z.string().min(1).max(500),
  reasonItFits: z.string().min(1).max(300),
  category: z.string().min(1).max(50).default('Experience'),
});

export const PlanDraftRiskSchema = z.object({
  title: z.string().min(1, 'Risk title is required').max(100),
  reason: z.string().min(1).max(300),
  suggestedAction: z.string().min(1).max(300),
  severity: TaskPriorityEnum.default('medium'),
});

export const PlanDraftSchema = z.object({
  summary: z.string().min(10, 'Summary is too short').max(600),
  assumptions: z.array(z.string().min(1).max(200)).min(1).max(10),
  budgetCategories: z.array(PlanDraftBudgetCategorySchema).min(3).max(12),
  tasks: z.array(PlanDraftTaskSchema).min(3).max(25),
  ideas: z.array(PlanDraftIdeaSchema).min(1).max(8),
  risks: z.array(PlanDraftRiskSchema).min(1).max(8),
});

/**
 * Normalizes budget percentages so they sum strictly to 100%
 */
export function normalizeBudgetCategories(categories: Array<{ name: string; percentage: number; reason: string }>) {
  const sum = categories.reduce((acc, cat) => acc + (cat.percentage || 0), 0);
  if (sum <= 0) {
    const even = Math.floor(100 / categories.length);
    let rem = 100 - even * categories.length;
    return categories.map((cat, idx) => ({
      ...cat,
      percentage: even + (idx === 0 ? rem : 0),
    }));
  }

  // Scale to 100
  let allocated = 0;
  const scaled = categories.map((cat, idx) => {
    if (idx === categories.length - 1) {
      // Last category absorbs the difference to guarantee exactly 100%
      return {
        ...cat,
        percentage: Math.max(0, Math.round((100 - allocated) * 10) / 10),
      };
    }
    const pct = Math.round((cat.percentage / sum) * 1000) / 10;
    allocated += pct;
    return {
      ...cat,
      percentage: pct,
    };
  });

  return scaled;
}

/**
 * JSON Schema for Gemini structured output API
 */
export const planDraftJsonSchema = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'A concise executive overview of the event plan (2-4 sentences).',
    },
    assumptions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Key assumptions made regarding missing user details or timeline.',
    },
    budgetCategories: {
      type: 'array',
      description: 'Starter budget categories with suggested percentage allocations summing to 100%.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          percentage: { type: 'number' },
          reason: { type: 'string' },
        },
        required: ['name', 'percentage', 'reason'],
      },
    },
    tasks: {
      type: 'array',
      description: 'Chronological priority tasks with daysBeforeEvent integer offset.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          daysBeforeEvent: { type: 'integer' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['title', 'description', 'category', 'daysBeforeEvent', 'priority'],
      },
    },
    ideas: {
      type: 'array',
      description: 'Context-specific ideas tailored to the event type and budget.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          reasonItFits: { type: 'string' },
          category: { type: 'string' },
        },
        required: ['title', 'description', 'reasonItFits', 'category'],
      },
    },
    risks: {
      type: 'array',
      description: 'Potential bottlenecks and actionable mitigations.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          reason: { type: 'string' },
          suggestedAction: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['title', 'reason', 'suggestedAction', 'severity'],
      },
    },
  },
  required: ['summary', 'assumptions', 'budgetCategories', 'tasks', 'ideas', 'risks'],
};
