import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId, verifyEventOwnership } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

const CreateBudgetItemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50).default('General'),
  planned_amount: z.number().int().min(0).default(0),
  quoted_amount: z.number().int().min(0).nullable().optional(),
  actual_amount: z.number().int().min(0).nullable().optional(),
  paid_amount: z.number().int().min(0).default(0),
  vendor_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  unit_cost_per_guest: z.number().int().min(0).nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isOwner = await verifyEventOwnership(id, userId);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const json = await req.json();
    const validated = CreateBudgetItemSchema.parse(json);

    const admin = createAdminClient();
    const { data: item, error } = await admin
      .from('budget_items')
      .insert({
        event_id: id,
        name: validated.name,
        category: validated.category,
        planned_amount: validated.planned_amount,
        quoted_amount: validated.quoted_amount ?? null,
        actual_amount: validated.actual_amount ?? null,
        paid_amount: validated.paid_amount,
        vendor_id: validated.vendor_id || null,
        notes: validated.notes || null,
        unit_cost_per_guest: validated.unit_cost_per_guest || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
