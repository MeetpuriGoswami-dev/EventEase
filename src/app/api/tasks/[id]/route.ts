import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId, verifyEventOwnership } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(50).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  assignee_label: z.string().max(50).nullable().optional(),
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
    const { data: task } = await admin.from('tasks').select('id, event_id').eq('id', id).single();
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const isOwner = await verifyEventOwnership(task.event_id, userId);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const json = await req.json();
    const validated = UpdateTaskSchema.parse(json);

    const { data: updated, error } = await admin
      .from('tasks')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: updated });
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
    const { data: task } = await admin.from('tasks').select('id, event_id').eq('id', id).single();
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const isOwner = await verifyEventOwnership(task.event_id, userId);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await admin.from('tasks').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
