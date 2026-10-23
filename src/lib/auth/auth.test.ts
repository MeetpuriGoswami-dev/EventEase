import { describe, it, expect, vi } from 'vitest';
import { verifyEventOwnership, DEMO_USER_ID } from './auth-helper';

// Mock the admin client
vi.mock('@/lib/supabase/admin', () => {
  return {
    createAdminClient: () => ({
      from: (table: string) => ({
        select: (cols: string) => ({
          eq: (field: string, value: string) => ({
            single: async () => {
              if (table === 'events' && value === 'event-user-1') {
                return { data: { id: 'event-user-1', owner_id: 'user-1' }, error: null };
              }
              if (table === 'events' && value === 'event-user-2') {
                return { data: { id: 'event-user-2', owner_id: 'user-2' }, error: null };
              }
              return { data: null, error: { message: 'Not found' } };
            },
          }),
        }),
      }),
    }),
  };
});

describe('verifyEventOwnership', () => {
  it('returns true when user is the verified owner of the event', async () => {
    const isOwner = await verifyEventOwnership('event-user-1', 'user-1');
    expect(isOwner).toBe(true);
  });

  it('strictly returns false when user attempts to access another user event', async () => {
    const isOwner = await verifyEventOwnership('event-user-2', 'user-1');
    expect(isOwner).toBe(false);
  });

  it('returns false for non-existent event', async () => {
    const isOwner = await verifyEventOwnership('non-existent', 'user-1');
    expect(isOwner).toBe(false);
  });

  it('exposes a valid DEMO_USER_ID format', () => {
    expect(DEMO_USER_ID).toBe('00000000-0000-0000-0000-000000000001');
  });
});
