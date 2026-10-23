import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId, verifyEventOwnership } from '@/lib/auth/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

const UpdateVendorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(50).optional(),
  contact: z.string().max(100).nullable().optional(),
  status: z.enum(['to_contact', 'contacted', 'quote_received', 'shortlisted', 'booked', 'not_selected']).optional(),
  quote_amount: z.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  advance_amount: z.number().int().min(0).nullable().optional(),
  balance_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
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
    const { data: vendor } = await admin.from('vendors').select('id, event_id').eq('id', id).single();
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    const isOwner = await verifyEventOwnership(vendor.event_id, userId);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const json = await req.json();
    const validated = UpdateVendorSchema.parse(json);

    const { data: updated, error } = await admin
      .from('vendors')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ vendor: updated });
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
    const { data: vendor } = await admin.from('vendors').select('id, event_id').eq('id', id).single();
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    const isOwner = await verifyEventOwnership(vendor.event_id, userId);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await admin.from('vendors').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
