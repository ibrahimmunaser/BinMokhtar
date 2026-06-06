import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/adminSessionToken';

/**
 * POST /api/admin/logout
 * Clears the admin session cookie.
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  clearAdminCookie(response);
  return response;
}
