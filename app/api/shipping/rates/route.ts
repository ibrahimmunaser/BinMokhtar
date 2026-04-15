import { NextRequest, NextResponse } from 'next/server';
import { FLAT_SHIPPING_RATE } from '@/lib/shipping/config';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shipping/rates
 * Returns the standard flat shipping rate ($9.99)
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    rates: [FLAT_SHIPPING_RATE],
  });
}
