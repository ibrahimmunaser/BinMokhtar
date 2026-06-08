/**
 * Server-side admin session token utilities.
 * Uses HMAC-SHA256 to sign a timestamped payload stored in an httpOnly cookie.
 * ONLY import this in API routes or server components — never in client code.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'bmr_admin_token';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    // Log a loud warning but do NOT crash — throwing here breaks the entire login flow.
    // Set ADMIN_SESSION_SECRET in your hosting environment for proper security.
    console.error(
      '⚠️  ADMIN_SESSION_SECRET is not set. Sessions are using an insecure fallback. ' +
      'Add ADMIN_SESSION_SECRET to your environment variables immediately.'
    );
    return 'bmr-fallback-secret-please-set-admin-session-secret-in-env';
  }
  return secret;
}

/** Create a signed session token for the given admin username. */
export function createAdminToken(username: string): string {
  const payload = `${username}:${Date.now()}`;
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

/** Verify a token and return the username, or null if invalid/expired. */
export function verifyAdminToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const lastPipe = decoded.lastIndexOf('|');
    if (lastPipe === -1) return null;

    const payload = decoded.slice(0, lastPipe);
    const sig = decoded.slice(lastPipe + 1);

    const expectedSig = crypto
      .createHmac('sha256', getSecret())
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return null;
    }

    const colonIdx = payload.lastIndexOf(':');
    const issuedAt = parseInt(payload.slice(colonIdx + 1), 10);
    if (Date.now() - issuedAt > SESSION_DURATION_MS) return null;

    return payload.slice(0, colonIdx);
  } catch {
    return null;
  }
}

/** Set the admin session cookie on a response. */
export function setAdminCookie(response: NextResponse, username: string): void {
  const token = createAdminToken(username);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  });
}

/** Clear the admin session cookie. */
export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Guard for admin API routes.
 * Returns a 401 NextResponse if the request has no valid admin session,
 * or null if the session is valid (allowing the route to continue).
 */
export function requireAdminSession(request: NextRequest): NextResponse | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const username = verifyAdminToken(token);
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
