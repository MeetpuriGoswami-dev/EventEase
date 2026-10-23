import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId, verifyEventOwnership } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

const TaskSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).default(''),
  category: z.string().min(1).max(50).default('General'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  assignee_label: z.string().max(50).nullable().optional(),
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
    const validated = TaskSchema.parse(json);

    const admin = createAdminClient();
    const { data: task, error } = await admin
      .from('tasks')
      .insert({
        event_id: id,
        title: validated.title,
        description: validated.description,
        category: validated.category,
        due_date: validated.due_date,
        priority: validated.priority,
        status: validated.status,
        assignee_label: validated.assignee_label || null,
        created_by: 'user',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
