/**
 * POST /api/admin/orders/[id]/retry-label
 * Regenerate packing slip for an order
 * Protected admin route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminSession } from '@/lib/adminSessionToken';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate packing slip URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const packingSlipUrl = `${baseUrl}/api/orders/packing-slip/${orderId}`;

    await orderRef.update({
      packingSlipUrl,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Packing slip URL regenerated',
      packingSlipUrl,
    });

  } catch (error: any) {
    console.error('Error regenerating packing slip:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
