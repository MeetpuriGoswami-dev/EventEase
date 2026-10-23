import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId, verifyEventOwnership } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

const CreateVendorSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50).default('General'),
  contact: z.string().max(100).nullable().optional(),
  status: z.enum(['to_contact', 'contacted', 'quote_received', 'shortlisted', 'booked', 'not_selected']).default('to_contact'),
  quote_amount: z.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).default('USD'),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  advance_amount: z.number().int().min(0).nullable().optional(),
  balance_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
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
    const validated = CreateVendorSchema.parse(json);

    const admin = createAdminClient();
    const { data: vendor, error } = await admin
      .from('vendors')
      .insert({
        event_id: id,
        name: validated.name,
        category: validated.category,
        contact: validated.contact || null,
        status: validated.status,
        quote_amount: validated.quote_amount ?? null,
        currency: validated.currency.toUpperCase(),
        inclusions: validated.inclusions,
        exclusions: validated.exclusions,
        advance_amount: validated.advance_amount ?? null,
        balance_due_date: validated.balance_due_date || null,
        notes: validated.notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
