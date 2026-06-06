import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from '@/lib/firebase/server';
import { createFulfillmentLabel } from '@/lib/shipping/fulfillment';
import {
  LOCAL_DELIVERY_FEE_CENTS,
  STANDARD_SHIPPING_FEE_CENTS,
  FulfillmentMethod,
  LocationZone,
} from '@/lib/shipping/config';
import { decrementInventoryForOrder } from '@/lib/inventory';

export const dynamic = 'force-dynamic';

interface CreateOrderRequest {
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Cart items
  items: Array<{
    productId: string;
    variantId: string;
    title: string;
    sku: string;
    qty: number;
    unitPrice: number; // in cents
    size?: string;
    color?: string;
    imageUrl?: string;
  }>;
  
  // Location and fulfillment
  locationZone: LocationZone | null;
  fulfillmentMethod: FulfillmentMethod;
  
  // For shipping orders (kept for backward compat, not required)
  selectedRateId?: string;
  selectedRateAmount?: number; // in cents
  
  // Optional
  giftMessage?: string;
  stripeSessionId?: string;
  stripePaymentIntent?: string;
}

/**
 * POST /api/orders/create
 * 
 * Create a new order with fulfillment handling
 */
export async function POST(request: NextRequest) {
  // This route is for local development only (bypasses Stripe webhook).
  // In production, orders are created by the Stripe webhook after payment.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  try {
    const body: CreateOrderRequest = await request.json();

    console.log('📦 Creating order:', {
      customerEmail: body.customerEmail,
      fulfillmentMethod: body.fulfillmentMethod,
      itemCount: body.items?.length,
    });

    // Validate required fields
    if (!body.customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must have at least one item' },
        { status: 400 }
      );
    }

    if (!body.fulfillmentMethod) {
      return NextResponse.json(
        { success: false, error: 'Fulfillment method is required' },
        { status: 400 }
      );
    }

    // Validate fulfillment method and zone combination
    if (body.fulfillmentMethod === 'local_delivery') {
      if (!body.locationZone || body.locationZone.zone !== 'local') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Local delivery is only available within our delivery area' 
          },
          { status: 400 }
        );
      }
    }


    // Calculate totals
    const subtotal = body.items.reduce(
      (sum, item) => sum + item.unitPrice * item.qty,
      0
    );

    let shippingAmount = 0;
    if (body.fulfillmentMethod === 'local_delivery') {
      shippingAmount = LOCAL_DELIVERY_FEE_CENTS;
    } else if (body.fulfillmentMethod === 'shipping') {
      shippingAmount = STANDARD_SHIPPING_FEE_CENTS;
    }

    // Tax calculation (could be enhanced with actual tax API)
    const taxRate = 0.06; // 6% Michigan sales tax
    const tax = Math.round(subtotal * taxRate);

    const total = subtotal + shippingAmount + tax;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Build order data
    const orderData = {
      orderNumber,
      status: 'PENDING',
      
      // Customer
      customerName: body.customerName || 'Customer',
      email: body.customerEmail,
      phone: body.customerPhone || null,
      
      // Items
      items: body.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        sku: item.sku,
        qty: item.qty,
        unitPrice: item.unitPrice,
        size: item.size || null,
        color: item.color || null,
        imageUrl: item.imageUrl || null,
      })),
      
      // Fulfillment
      fulfillmentMethod: body.fulfillmentMethod,
      locationZone: body.locationZone ? {
        formattedAddress: body.locationZone.formattedAddress,
        street: body.locationZone.street || null,
        city: body.locationZone.city,
        state: body.locationZone.state,
        zip: body.locationZone.zip,
        country: body.locationZone.country,
        distanceMiles: body.locationZone.distanceMiles,
        zone: body.locationZone.zone,
      } : null,
      
      // Shipping address (for delivery/shipping)
      shippingAddress: body.locationZone && body.fulfillmentMethod !== 'pickup' ? {
        fullName: body.customerName || 'Customer',
        email: body.customerEmail,
        phone: body.customerPhone || null,
        address: body.locationZone.street || body.locationZone.formattedAddress,
        city: body.locationZone.city,
        state: body.locationZone.state,
        zip: body.locationZone.zip,
        country: body.locationZone.country,
      } : null,
      
      
      // Totals
      subtotal,
      shipping: shippingAmount,
      tax,
      total,
      currency: 'USD',
      
      // Stripe
      stripeSessionId: body.stripeSessionId || null,
      stripePaymentIntent: body.stripePaymentIntent || null,
      
      // Optional
      giftMessage: body.giftMessage || null,
      
      // Timestamps - use FieldValue.serverTimestamp() for proper Firestore storage
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Save order to Firebase
    const db = adminDb();
    const orderRef = await db.collection('orders').add(orderData);
    const orderId = orderRef.id;

    console.log('✅ Order created:', orderId);

    // Decrement inventory for all items in the order
    console.log('📦 Decrementing inventory...');
    try {
      const inventoryResult = await decrementInventoryForOrder(
        body.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          size: item.size,
          color: item.color,
          qty: item.qty,
          sku: item.sku,
        }))
      );
      
      if (!inventoryResult.success) {
        console.warn('⚠️ Some inventory updates failed:', inventoryResult.errors);
        // Log errors but don't fail the order - inventory can be manually adjusted
      } else {
        console.log('✅ Inventory decremented successfully');
      }
    } catch (inventoryError: any) {
      console.error('❌ Inventory decrement failed:', inventoryError);
      // Don't fail the order if inventory update fails - can be fixed manually
    }

    // Create fulfillment label/packing slip
    let fulfillmentResult = {};
    try {
      const labelData = await createFulfillmentLabel({
        id: orderId,
        orderNumber,
        fulfillment: {
          method: body.fulfillmentMethod,
          locationZone: body.locationZone!,
          shippingAmount,
          localDeliveryFee: body.fulfillmentMethod === 'local_delivery' ? LOCAL_DELIVERY_FEE_CENTS : undefined,
        },
        customerName: body.customerName || 'Customer',
        customerEmail: body.customerEmail,
        items: body.items,
        subtotal,
        shipping: shippingAmount,
        tax,
        total,
      });

      fulfillmentResult = labelData;

      // Update order with fulfillment info
      await orderRef.update({
        packingSlipUrl: labelData.packingSlipUrl || null,
        updatedAt: new Date(),
      });

      console.log('✅ Fulfillment documents created');
    } catch (fulfillmentError: any) {
      console.error('⚠️ Fulfillment label creation failed:', fulfillmentError);
      // Don't fail the order, just log the error
      // The label can be created manually later
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        ...orderData,
        ...fulfillmentResult,
      },
    });

  } catch (error: any) {
    console.error('❌ Order creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BMR-${timestamp}-${random}`;
}

