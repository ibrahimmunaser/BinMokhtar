/**
 * GET /api/orders/internal-label/[orderId]
 * 
 * Renders an internal label (for pickup/local_delivery orders) as HTML
 * This can be printed directly from the browser
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { generateInternalLabelHtml } from '@/lib/shipping/internalLabel';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;

    if (!orderId) {
      return new NextResponse('Order ID required', { status: 400 });
    }

    // Fetch order from Firestore
    const db = adminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return new NextResponse('Order not found', { status: 404 });
    }

    const order = {
      id: orderDoc.id,
      ...orderDoc.data(),
    };

    // Generate HTML label
    const html = generateInternalLabelHtml(order as any);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error generating internal label:', error);
    return new NextResponse(
      `Error generating label: ${error.message}`,
      { status: 500 }
    );
  }
}




