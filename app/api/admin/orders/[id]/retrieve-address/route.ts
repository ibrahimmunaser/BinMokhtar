import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { stripe } from '@/lib/stripe/config';

/**
 * POST /api/admin/orders/[id]/retrieve-address
 * Retrieve shipping address from Stripe checkout session and update order
 */
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

    if (!order?.stripeSessionId) {
      return NextResponse.json(
        { success: false, error: 'Order does not have a Stripe session ID. Cannot retrieve address from Stripe.' },
        { status: 400 }
      );
    }

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
      expand: ['shipping_details', 'customer_details'],
    });

    // Extract shipping address from Stripe session
    const shippingAddress = session.shipping_details?.address;
    const customerName = session.customer_details?.name || order.customerName || '';
    const customerEmail = session.customer_details?.email || session.customer_email || order.email || '';

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'No shipping address found in Stripe checkout session. The customer may have selected pickup or the address was not collected.' },
        { status: 404 }
      );
    }

    // Build shipping address object
    const addressData = {
      fullName: customerName,
      email: customerEmail,
      address: shippingAddress.line1 || '',
      address2: shippingAddress.line2 || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      zip: shippingAddress.postal_code || '',
      country: shippingAddress.country || '',
      phone: session.customer_details?.phone || order.phone || '',
    };

    // Validate required fields
    if (!addressData.address || !addressData.city || !addressData.state || !addressData.zip || !addressData.country) {
      return NextResponse.json(
        { success: false, error: 'Shipping address from Stripe is incomplete. Missing required fields.' },
        { status: 400 }
      );
    }

    // Update order with shipping address
    await orderRef.update({
      shippingAddress: addressData,
      customerName: customerName || order.customerName,
      email: customerEmail || order.email,
      phone: addressData.phone || order.phone,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Shipping address retrieved and updated successfully',
      shippingAddress: addressData,
    });

  } catch (error: any) {
    console.error('Error retrieving address from Stripe:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve address from Stripe' },
      { status: 500 }
    );
  }
}








