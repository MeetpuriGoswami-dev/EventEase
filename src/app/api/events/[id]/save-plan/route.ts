import { NextResponse } from 'next/server';
import { getCurrentUserId, verifyEventOwnership } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';
import { PlanDraftSchema } from '@/lib/ai/schema';
import { calculateDueDate } from '@/lib/calculations';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyEventOwnership(id, userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await req.json();
    const validatedDraft = PlanDraftSchema.parse(json.draft);

    const admin = createAdminClient();
    const { data: event, error: eventErr } = await admin
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 1. Prepare tasks with deterministic dates calculated from daysBeforeEvent
    const tasksToInsert = validatedDraft.tasks.map((task) => {
      const { dueDate } = calculateDueDate(event.event_date, task.daysBeforeEvent);
      return {
        event_id: id,
        title: task.title,
        description: task.description || '',
        category: task.category || 'General',
        due_date: dueDate,
        priority: task.priority || 'medium',
        status: 'todo',
        created_by: 'ai',
      };
    });

    // 2. Prepare budget items with planned_amount calculated deterministically from percentages
    const totalBudget = Number(event.total_budget || 0);
    const budgetItemsToInsert = validatedDraft.budgetCategories.map((cat) => {
      const plannedAmount = totalBudget > 0
        ? Math.round((totalBudget * (cat.percentage / 100)))
        : 0;

      return {
        event_id: id,
        name: cat.name,
        category: cat.name,
        planned_amount: plannedAmount,
        notes: `AI suggested ${cat.percentage}%: ${cat.reason}`,
      };
    });

    // 3. Insert tasks and budget items in transaction / batch
    const [tasksRes, budgetRes] = await Promise.all([
      admin.from('tasks').insert(tasksToInsert).select(),
      admin.from('budget_items').insert(budgetItemsToInsert).select(),
    ]);

    if (tasksRes.error) {
      return NextResponse.json({ error: `Failed to save tasks: ${tasksRes.error.message}` }, { status: 500 });
    }
    if (budgetRes.error) {
      return NextResponse.json({ error: `Failed to save budget items: ${budgetRes.error.message}` }, { status: 500 });
    }

    // 4. Update event preferences to store ideas, assumptions, risks and summary for the Ideas screen
    const existingPrefs = (event.preferences && typeof event.preferences === 'object') ? event.preferences : {};
    const updatedPreferences = {
      ...existingPrefs,
      aiPlan: {
        summary: validatedDraft.summary,
        assumptions: validatedDraft.assumptions,
        ideas: validatedDraft.ideas,
        risks: validatedDraft.risks,
        savedAt: new Date().toISOString(),
      },
    };

    await admin
      .from('events')
      .update({ preferences: updatedPreferences })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      tasksAdded: tasksRes.data?.length || 0,
      budgetItemsAdded: budgetRes.data?.length || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
