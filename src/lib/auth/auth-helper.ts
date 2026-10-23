import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return user.id;
    }
  } catch (err: unknown) {
    const isDynamicError = typeof err === 'object' && err !== null && 'digest' in err && (err as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE';
    if (isDynamicError) throw err;
    console.warn('Error reading supabase user session:', err);
  }

  // Check demo user cookie for 1-click evaluation access
  try {
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get('demo_user_id');
    if (demoCookie?.value) {
      return demoCookie.value;
    }
  } catch (err: unknown) {
    const isDynamicError = typeof err === 'object' && err !== null && 'digest' in err && (err as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE';
    if (isDynamicError) throw err;
    // Ignore in non-request contexts
  }

  return null;
}

/**
 * Checks if the given userId owns the event with eventId.
 * Throws or returns boolean.
 */
export async function verifyEventOwnership(eventId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .select('id, owner_id')
    .eq('id', eventId)
    .single();

  if (error || !data) return false;
  return data.owner_id === userId;
}
