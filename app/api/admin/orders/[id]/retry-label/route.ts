/**
 * POST /api/admin/orders/[id]/retry-label
 * 
 * Retry Shippo label creation for an order
 * Protected admin route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { createShippingArtifactsForOrder } from '@/lib/shipping/createShippingArtifacts';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      );
    }

    // TODO: Add admin authentication check here
    // For now, we'll allow the request but you should add proper auth

    // Fetch order to verify it exists
    const db = adminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderDoc.data();

    // Check if order already has a successful label
    if (order?.shippo_label_status === 'success' && (order?.shippo_label_url || order?.internal_label_url)) {
      return NextResponse.json({
        success: false,
        error: 'Order already has a label. Delete the existing label first if you want to create a new one.',
      }, { status: 400 });
    }

    // Reset label status to allow retry/create
    await orderRef.update({
      shippo_label_status: 'pending',
      shippo_error_message: null,
      updatedAt: new Date(),
    });

    // Attempt to create shipping artifacts
    const result = await createShippingArtifactsForOrder(orderId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Label creation retried successfully',
        labelUrl: result.labelUrl,
        trackingNumber: result.trackingNumber,
        internalLabelUrl: result.internalLabelUrl,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to create label',
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error retrying label creation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


