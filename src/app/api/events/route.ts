import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

const CreateEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100),
  event_type: z.enum(['wedding', 'birthday', 'community']),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)'),
  city: z.string().max(80).nullable().optional(),
  currency: z.string().length(3).default('USD'),
  guest_count: z.number().int().min(1).max(50000).nullable().optional(),
  total_budget: z.number().int().min(0, 'Budget must be non-negative'), // in minor units
  preferences: z.record(z.string(), z.any()).default({}),
});

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: events, error } = await admin
      .from('events')
      .select('*')
      .eq('owner_id', userId)
      .order('event_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const json = await req.json();
    const validated = CreateEventSchema.parse(json);

    const admin = createAdminClient();
    const { data: event, error } = await admin
      .from('events')
      .insert({
        owner_id: userId,
        name: validated.name,
        event_type: validated.event_type,
        event_date: validated.event_date,
        city: validated.city || null,
        currency: validated.currency.toUpperCase(),
        guest_count: validated.guest_count || null,
        total_budget: validated.total_budget,
        preferences: validated.preferences || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
