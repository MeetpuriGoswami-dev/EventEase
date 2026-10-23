import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId, verifyEventOwnership } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

const UpdateBudgetItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(50).optional(),
  planned_amount: z.number().int().min(0).optional(),
  quoted_amount: z.number().int().min(0).nullable().optional(),
  actual_amount: z.number().int().min(0).nullable().optional(),
  paid_amount: z.number().int().min(0).optional(),
  vendor_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  unit_cost_per_guest: z.number().int().min(0).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: item } = await admin.from('budget_items').select('id, event_id').eq('id', id).single();
    if (!item) return NextResponse.json({ error: 'Budget item not found' }, { status: 404 });

    const isOwner = await verifyEventOwnership(item.event_id, userId);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const json = await req.json();
    const validated = UpdateBudgetItemSchema.parse(json);

    const { data: updated, error } = await admin
      .from('budget_items')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: updated });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: item } = await admin.from('budget_items').select('id, event_id').eq('id', id).single();
    if (!item) return NextResponse.json({ error: 'Budget item not found' }, { status: 404 });

    const isOwner = await verifyEventOwnership(item.event_id, userId);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await admin.from('budget_items').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
