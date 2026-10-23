import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_USER_ID } from '@/lib/auth/auth-helper';

export async function POST(req: Request) {
  try {
    const { action } = await req.json().catch(() => ({ action: 'login' }));
    const cookieStore = await cookies();

    if (action === 'logout') {
      cookieStore.delete('demo_user_id');
      return NextResponse.json({ success: true, message: 'Logged out of demo mode' });
    }

    // Set demo cookie for 30 days
    cookieStore.set('demo_user_id', DEMO_USER_ID, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return NextResponse.json({ success: true, userId: DEMO_USER_ID });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
