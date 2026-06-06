import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generatePackingSlipHtml } from '@/lib/shipping/fulfillment';
import { requireAdminSession } from '@/lib/adminSessionToken';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/packing-slip/[orderId]
 * 
 * Generate and return a printable packing slip for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order from Firebase
    const db = adminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Build order object for packing slip
    const order = {
      id: orderId,
      orderNumber: orderData?.orderNumber || orderId.slice(-8).toUpperCase(),
      fulfillment: {
        method: orderData?.fulfillmentMethod || 'pickup',
        locationZone: orderData?.shippingAddress ? {
          formattedAddress: [
            orderData.shippingAddress.address,
            orderData.shippingAddress.city,
            orderData.shippingAddress.state,
            orderData.shippingAddress.zip,
          ].filter(Boolean).join(', '),
          city: orderData.shippingAddress.city || '',
          state: orderData.shippingAddress.state || '',
          zip: orderData.shippingAddress.zip || '',
          country: orderData.shippingAddress.country || 'US',
          lat: 0,
          lng: 0,
          distanceMiles: 0,
          zone: 'local' as const,
          source: 'manual' as const,
        } : null,
      },
      customerName: orderData?.shippingAddress?.fullName || orderData?.customerName || 'Customer',
      customerEmail: orderData?.email || '',
      items: (orderData?.items || []).map((item: any) => ({
        title: item.title || item.name || 'Product',
        sku: item.sku || '',
        qty: item.qty || 1,
        unitPrice: item.unitPrice || 0,
        size: item.size,
        color: item.color,
        imageUrl: item.imageUrl,
      })),
      subtotal: orderData?.subtotal || 0,
      shipping: orderData?.shipping || 0,
      tax: orderData?.tax || 0,
      total: orderData?.total || 0,
    };

    // Generate HTML packing slip
    const html = generatePackingSlipHtml(order);

    // Return as HTML
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: any) {
    console.error('Error generating packing slip:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate packing slip' },
      { status: 500 }
    );
  }
}

