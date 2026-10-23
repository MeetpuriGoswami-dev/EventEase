import { describe, it, expect } from 'vitest';
import { PlanDraftSchema, normalizeBudgetCategories } from './schema';

describe('PlanDraftSchema validation', () => {
  const validDraft = {
    summary: 'A wonderful outdoor community festival bringing together local artists, families, and neighborhood organizations.',
    assumptions: ['Venue permits will be secured 60 days before event', 'Weather will permit outdoor activities'],
    budgetCategories: [
      { name: 'Venue & Staging', percentage: 35, reason: 'Covers park permit, stage and sound rental' },
      { name: 'Food & Refreshments', percentage: 40, reason: 'Subsidized community meals and water stations' },
      { name: 'Marketing & Signage', percentage: 15, reason: 'Fliers and directional boards' },
      { name: 'Contingency', percentage: 10, reason: 'Rain backup supplies' },
    ],
    tasks: [
      {
        title: 'Apply for park permit',
        description: 'Submit municipal permit request with expected attendance',
        category: 'Legal & Permits',
        daysBeforeEvent: 90,
        priority: 'high',
      },
      {
        title: 'Book audio vendor',
        description: 'Reserve PA system and microphone setup',
        category: 'Production',
        daysBeforeEvent: 60,
        priority: 'high',
      },
      {
        title: 'Send volunteer roster',
        description: 'Assign shifts for setup, greeting, and breakdown',
        category: 'Volunteers',
        daysBeforeEvent: 14,
        priority: 'medium',
      },
    ],
    ideas: [
      {
        title: 'Community Mural Corner',
        description: 'Interactive canvas for attendees of all ages to paint',
        reasonItFits: 'Fosters grassroots participation within low budget',
        category: 'Activity',
      },
    ],
    risks: [
      {
        title: 'Inclement weather',
        reason: 'Event is partially outdoors',
        suggestedAction: 'Rent two pop-up canopies as rain contingency',
        severity: 'high',
      },
    ],
  };

  it('validates a correct PlanDraft', () => {
    const parsed = PlanDraftSchema.safeParse(validDraft);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid task priority enum', () => {
    const invalid = {
      ...validDraft,
      tasks: [
        {
          ...validDraft.tasks[0],
          priority: 'urgent', // Invalid priority enum
        },
      ],
    };
    const parsed = PlanDraftSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects negative daysBeforeEvent', () => {
    const invalid = {
      ...validDraft,
      tasks: [
        {
          ...validDraft.tasks[0],
          daysBeforeEvent: -5,
        },
      ],
    };
    const parsed = PlanDraftSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('normalizes budget categories to sum strictly to 100%', () => {
    const rawCategories = [
      { name: 'Venue', percentage: 33, reason: 'r1' },
      { name: 'Food', percentage: 33, reason: 'r2' },
      { name: 'Music', percentage: 33, reason: 'r3' },
    ];
    const normalized = normalizeBudgetCategories(rawCategories);
    const sum = normalized.reduce((acc, c) => acc + c.percentage, 0);
    expect(Math.round(sum)).toBe(100);
  });
});
