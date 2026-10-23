import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId, verifyEventOwnership } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: event, error: eventErr } = await admin
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this event' }, { status: 403 });
    }

    // Fetch related records in parallel
    const [tasksRes, budgetRes, vendorsRes] = await Promise.all([
      admin.from('tasks').select('*').eq('event_id', id).order('due_date', { ascending: true }),
      admin.from('budget_items').select('*').eq('event_id', id).order('created_at', { ascending: true }),
      admin.from('vendors').select('*').eq('event_id', id).order('created_at', { ascending: true }),
    ]);

    return NextResponse.json({
      event,
      tasks: tasksRes.data || [],
      budgetItems: budgetRes.data || [],
      vendors: vendorsRes.data || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const UpdateEventSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  event_type: z.enum(['wedding', 'birthday', 'community']).optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  city: z.string().max(80).nullable().optional(),
  currency: z.string().length(3).optional(),
  guest_count: z.number().int().min(1).max(50000).nullable().optional(),
  total_budget: z.number().int().min(0).optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

export async function PATCH(
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
    const validated = UpdateEventSchema.parse(json);

    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from('events')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: updated });
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
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyEventOwnership(id, userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('events').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
