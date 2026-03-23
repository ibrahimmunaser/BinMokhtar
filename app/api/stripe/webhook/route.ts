import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe/config';
import { adminDb, FieldValue, Timestamp } from '@/lib/firebase/server';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email';
import { createShippingArtifactsForOrder } from '@/lib/shipping/createShippingArtifacts';
import { calculateOrderWeight } from '@/lib/shipping/calculateOrderWeight';
import { decrementInventoryForOrder } from '@/lib/inventory';
import Stripe from 'stripe';

// Mark as dynamic route (webhooks are always dynamic)
export const dynamic = 'force-dynamic';

// Updated: 2025-12-06 - Using Timestamp.now() for reliable timestamps

// Use Node.js runtime for better compatibility with Stripe webhooks
export const runtime = 'nodejs';

// Prevent Next.js from parsing the body - we need raw bytes for Stripe signature verification
export const fetchCache = 'force-no-store';

// Disable body size limit for webhook payloads
export const maxDuration = 60; // Max function duration in seconds

/**
 * GET /api/stripe/webhook
 * Test endpoint to verify webhook URL is accessible
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 * IMPORTANT: This endpoint must be configured in your Stripe Dashboard
 */
export async function POST(request: NextRequest) {
  console.log('📥 Webhook received at:', new Date().toISOString());
  console.log('📥 Request method:', request.method);
  console.log('📥 Request URL:', request.url);
  
  // Get raw body - CRITICAL for signature verification
  // We need the EXACT bytes that Stripe sent, so use arrayBuffer and convert to Buffer
  let body: Buffer;
  let bodyString: string;
  try {
    const rawBody = await request.arrayBuffer();
    body = Buffer.from(rawBody);
    bodyString = body.toString('utf8');
    console.log('📥 Body received as Buffer, length:', body.length);
    console.log('📥 Body as string length:', bodyString.length);
    console.log('📥 Body first 100 chars:', bodyString.substring(0, 100));
  } catch (error: any) {
    console.error('❌ Error reading request body:', error);
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }
  
  const signature = request.headers.get('stripe-signature');
  console.log('📥 Signature present:', !!signature);
  console.log('📥 Signature value:', signature ? `${signature.substring(0, 20)}...` : 'MISSING');
  console.log('📥 STRIPE_WEBHOOK_SECRET exists:', !!STRIPE_WEBHOOK_SECRET);
  console.log('📥 STRIPE_WEBHOOK_SECRET length:', STRIPE_WEBHOOK_SECRET?.length || 0);
  console.log('📥 STRIPE_WEBHOOK_SECRET type:', typeof STRIPE_WEBHOOK_SECRET);
  console.log('📥 STRIPE_WEBHOOK_SECRET first 10 chars:', STRIPE_WEBHOOK_SECRET?.substring(0, 10) || 'NOT SET');
  console.log('📥 STRIPE_WEBHOOK_SECRET last 10 chars:', STRIPE_WEBHOOK_SECRET?.substring(STRIPE_WEBHOOK_SECRET.length - 10) || 'NOT SET');
  console.log('📥 STRIPE_WEBHOOK_SECRET exact value:', JSON.stringify(STRIPE_WEBHOOK_SECRET));

  if (!signature) {
    console.error('❌ No Stripe signature found');
    console.error('❌ Request headers:', Object.fromEntries(request.headers.entries()));
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
    console.error('❌ Add STRIPE_WEBHOOK_SECRET to Render environment variables');
    return NextResponse.json({ 
      error: 'Webhook secret not configured',
      message: 'Add STRIPE_WEBHOOK_SECRET to environment variables'
    }, { status: 500 });
  }

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    console.log('🔐 Attempting to verify webhook signature...');
    console.log('🔐 Body (Buffer) length:', body.length);
    console.log('🔐 Body (string) length:', bodyString.length);
    console.log('🔐 Signature header:', signature ? 'present' : 'missing');
    console.log('🔐 Webhook secret length:', STRIPE_WEBHOOK_SECRET?.length || 0);
    
    // Verify signature using the raw Buffer
    // Stripe's constructEvent can accept Buffer, string, or Uint8Array
    event = stripe.webhooks.constructEvent(
      body, // Use Buffer for most accurate signature verification
      signature!,
      STRIPE_WEBHOOK_SECRET!
    );
    
    console.log('✅ Webhook signature verified successfully');
    console.log('✅ Event type:', event.type);
    console.log('✅ Event ID:', event.id);
  } catch (err: any) {
    console.error('❌ ===== WEBHOOK SIGNATURE VERIFICATION FAILED =====');
    console.error('❌ Error type:', err?.constructor?.name);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error code:', (err as any)?.code);
    console.error('❌ Body (Buffer) length:', body.length);
    console.error('❌ Body (string) length:', bodyString.length);
    console.error('❌ Body is Buffer:', Buffer.isBuffer(body));
    console.error('❌ Signature present:', !!signature);
    console.error('❌ Signature value (first 50 chars):', signature?.substring(0, 50));
    console.error('❌ Webhook secret present:', !!STRIPE_WEBHOOK_SECRET);
    console.error('❌ Webhook secret length:', STRIPE_WEBHOOK_SECRET?.length || 0);
    console.error('❌ Webhook secret (JSON):', JSON.stringify(STRIPE_WEBHOOK_SECRET));
    console.error('❌ This usually means:');
    console.error('   1. STRIPE_WEBHOOK_SECRET in Render does not match Stripe Dashboard');
    console.error('   2. Webhook secret was rolled/changed in Stripe but not updated in Render');
    console.error('   3. Wrong webhook endpoint (using secret from different webhook)');
    console.error('   4. Request body was modified by proxy/middleware before reaching handler');
    console.error('   5. Body encoding issue (must be UTF-8)');
    
    // Check if secret matches expected format
    if (STRIPE_WEBHOOK_SECRET && !STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
      console.error('❌ Webhook secret does not start with "whsec_" - invalid format!');
    }
    
    return NextResponse.json({ 
      error: `Webhook Error: ${err.message}`,
      hint: 'Check that STRIPE_WEBHOOK_SECRET in Render matches the signing secret in Stripe Dashboard exactly',
      details: {
        bodyLength: body.length,
        signaturePresent: !!signature,
        secretPresent: !!STRIPE_WEBHOOK_SECRET,
        secretLength: STRIPE_WEBHOOK_SECRET?.length || 0,
      }
    }, { status: 400 });
  }

    console.log('✅ Received Stripe webhook event:', event.type);
    console.log('📋 Event ID:', event.id);
    console.log('📋 Event created:', new Date(event.created * 1000).toISOString());
    console.log('📋 Event livemode:', event.livemode);
    const eventObject = event.data?.object as any;
    console.log('📋 Event object type:', eventObject?.object);

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('🎉 ===== PROCESSING checkout.session.completed =====');
        console.log('📧 Session ID:', session.id);
        console.log('📧 Session customer email:', session.customer_email);
        console.log('📧 Session customer_details:', JSON.stringify(session.customer_details, null, 2));
        console.log('📧 Session metadata:', JSON.stringify(session.metadata, null, 2));
        console.log('📧 Session payment_status:', session.payment_status);
        console.log('📧 Session status:', session.status);
        console.log('📧 Session amount_total:', session.amount_total);
        console.log('📧 Session mode:', session.mode);
        console.log('📧 Session livemode:', session.livemode);
        
        // Only process paid sessions
        if (session.payment_status !== 'paid') {
          console.warn('⚠️ Session payment_status is not "paid":', session.payment_status);
          console.warn('⚠️ Skipping order creation - payment not completed');
          return NextResponse.json({ 
            received: true, 
            message: 'Session not paid, skipping order creation' 
          });
        }
        
        try {
          await handleCheckoutSessionCompleted(session);
          console.log('✅ ===== checkout.session.completed HANDLED SUCCESSFULLY =====');
        } catch (handlerError: any) {
          console.error('❌ ===== ERROR IN handleCheckoutSessionCompleted =====');
          console.error('❌ Error type:', handlerError?.constructor?.name);
          console.error('❌ Error message:', handlerError?.message);
          console.error('❌ Error stack:', handlerError?.stack);
          console.error('❌ Full error:', JSON.stringify(handlerError, Object.getOwnPropertyNames(handlerError), 2));
          // Don't fail the webhook - return 200 so Stripe doesn't retry
          // But log the error clearly
          console.error('⚠️ Returning 200 to prevent Stripe retries, but email may not have been sent');
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💰 PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ PaymentIntent failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    console.log('✅ ===== WEBHOOK PROCESSING COMPLETE =====');
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ ===== CRITICAL ERROR HANDLING WEBHOOK =====');
    console.error('❌ Error type:', error?.constructor?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return NextResponse.json(
      { error: 'Webhook handler failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 * Creates order in Firebase and updates inventory
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Checkout session completed:', session.id);

  try {
    console.log('📦 Step 1: Retrieving full session with line items...');
    // Retrieve full session with line items
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'line_items.data.price.product'],
    });
    console.log('✅ Step 1: Session retrieved successfully');

    // Parse cart items from metadata (if available)
    // Note: For orders with 5+ items, metadata may only contain sample/summary
    // Full cart data is always available from line_items
    const cartItemsStr = session.metadata?.cartItems;
    const cartItemsSampleStr = session.metadata?.cartItemsSample;
    let cartItems: any[] = [];
    
    if (cartItemsStr) {
      try {
        cartItems = JSON.parse(cartItemsStr);
      } catch (e) {
        console.warn('Failed to parse cartItems from metadata');
      }
    } else if (cartItemsSampleStr) {
      try {
        // Parse sample items (shortened format)
        const sampleItems = JSON.parse(cartItemsSampleStr);
        cartItems = sampleItems.map((item: any) => ({
          productId: item.id,
          variantId: item.v,
          qty: item.q,
        }));
        console.log('ℹ️ Using cart items sample from metadata (full data in line_items)');
      } catch (e) {
        console.warn('Failed to parse cartItemsSample from metadata');
      }
    }
    
    // Note: If cartItems is empty, we'll reconstruct from line_items below
    if (cartItems.length === 0) {
      console.log('ℹ️ No cart items in metadata - will reconstruct from line_items');
    }

    // Extract customer details
    const customerEmail = session.customer_details?.email || session.customer_email || '';
    const customerName = session.customer_details?.name || '';
    
    // Try to get shipping address from multiple sources (priority order):
    // 1. From checkout form metadata (locationZone) - this is what customer entered
    // 2. From Stripe's shipping_details (if customer filled it in Stripe checkout)
    let shippingAddress: any = null;
    let locationZoneFromMetadata: any = null;
    
    // Parse locationZone from metadata (sent from checkout form)
    if (session.metadata?.locationZone) {
      try {
        locationZoneFromMetadata = JSON.parse(session.metadata.locationZone);
        console.log('📦 LocationZone from metadata:', locationZoneFromMetadata);
      } catch (e) {
        console.error('Failed to parse locationZone from metadata');
      }
    }
    
    // Get delivery address from metadata (formatted address from checkout form)
    const deliveryAddressFromMetadata = session.metadata?.deliveryAddress;
    
    // Build shipping address from checkout form data (preferred source)
    // The checkout form sends locationZone in metadata with the address the customer entered
    if (locationZoneFromMetadata && session.metadata?.fulfillmentMethod !== 'pickup') {
      // Use the address from the checkout form (what customer actually entered in your form)
      // This is the PRIMARY source - the address from your checkout form, not Stripe's form
      const street = locationZoneFromMetadata.street || 
                     (deliveryAddressFromMetadata ? deliveryAddressFromMetadata.split(',')[0].trim() : '') ||
                     locationZoneFromMetadata.formattedAddress?.split(',')[0].trim() || '';
      
      shippingAddress = {
        line1: street,
        line2: '',
        city: locationZoneFromMetadata.city || '',
        state: locationZoneFromMetadata.state || '',
        postal_code: locationZoneFromMetadata.zip || '',
        country: locationZoneFromMetadata.country || 'US',
      };
      console.log('✅ Using shipping address from checkout form (customer entered in your form):', shippingAddress);
    } else if (session.shipping_details?.address) {
      // Fallback to Stripe's shipping_details if metadata not available
      // This happens if customer filled address in Stripe's checkout page instead
      shippingAddress = session.shipping_details.address;
      console.log('⚠️ Using shipping address from Stripe checkout page (fallback - customer may have entered different address)');
    } else {
      console.warn('⚠️ No shipping address found in checkout form metadata or Stripe shipping_details');
    }
    
    const billingAddress = session.customer_details?.address;

    // Calculate totals (amounts are in cents)
    // Note: Since we add shipping as a line item, we need to extract it from line items
    // and exclude it from the subtotal calculation
    const total = session.amount_total || 0;
    const tax = (session.total_details?.amount_tax || 0);
    
    // Extract shipping cost from line items (shipping is added as a line item)
    let shipping = 0;
    const shippingLineItems: Stripe.LineItem[] = [];
    const productLineItems: Stripe.LineItem[] = [];
    
    if (fullSession.line_items?.data) {
      for (const lineItem of fullSession.line_items.data) {
        const product = lineItem.price?.product as Stripe.Product;
        const productName = product?.name || lineItem.description || '';
        
        // Check if this is a shipping line item
        // Shipping line items typically have names like "Shipping", "Local Delivery", etc.
        const isShippingItem = 
          productName.toLowerCase().includes('shipping') ||
          productName.toLowerCase().includes('delivery') ||
          productName.toLowerCase().includes('handling') ||
          !product?.metadata?.productId; // Shipping items don't have productId in metadata
        
        if (isShippingItem) {
          shippingLineItems.push(lineItem);
          shipping += (lineItem.amount_total || 0);
          console.log('📦 Found shipping line item:', {
            name: productName,
            amount: lineItem.amount_total,
            totalShipping: shipping,
          });
        } else {
          productLineItems.push(lineItem);
        }
      }
    }
    
    // Fallback: If no shipping found in line items, try metadata or calculate
    if (shipping === 0) {
      // Try metadata first (what we sent from checkout form)
      const metadataShipping = session.metadata?.shippingAmount;
      if (metadataShipping) {
        shipping = typeof metadataShipping === 'number' 
          ? metadataShipping 
          : parseInt(String(metadataShipping), 10);
        console.log('📦 Using shipping from metadata:', shipping);
      } else {
        // Calculate as: total - subtotal - tax
        // But we need to recalculate subtotal without shipping items
        const calculatedSubtotal = productLineItems.reduce(
          (sum, item) => sum + (item.amount_total || 0),
          0
        );
        shipping = total - calculatedSubtotal - tax;
        console.log('📦 Calculated shipping from totals:', {
          total,
          calculatedSubtotal,
          tax,
          shipping,
        });
      }
    }
    
    // Recalculate subtotal excluding shipping items
    const subtotal = productLineItems.reduce(
      (sum, item) => sum + (item.amount_total || 0),
      0
    ) || session.amount_subtotal || 0;
    
    console.log('💰 Order totals:', {
      subtotal,
      shipping,
      tax,
      total,
      calculatedTotal: subtotal + shipping + tax,
    });

    // Helper function to remove undefined values from an object
    const removeUndefined = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(removeUndefined).filter(item => item !== undefined);
      }
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefined(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    // Create order in Firebase
    const orderData = {
      // Payment info
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      paymentStatus: session.payment_status, // 'paid', 'unpaid', or 'no_payment_required'
      
      // User association (for order history)
      userId: session.metadata?.userId || null,
      
      // Customer info
      email: customerEmail,
      customerName,
      
      // Shipping address
      shippingAddress: shippingAddress ? {
        fullName: customerName,
        email: customerEmail,
        address: shippingAddress.line1 || '',
        address2: shippingAddress.line2 || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zip: shippingAddress.postal_code || '',
        country: shippingAddress.country || '',
        phone: session.customer_details?.phone || '',
      } : null,

      // Billing address
      billingAddress: billingAddress ? {
        line1: billingAddress.line1 || '',
        line2: billingAddress.line2 || '',
        city: billingAddress.city || '',
        state: billingAddress.state || '',
        zip: billingAddress.postal_code || '',
        country: billingAddress.country || '',
      } : null,
      
      // Order items (exclude shipping line items - only include actual products)
      items: productLineItems.map((lineItem) => {
        const product = lineItem.price?.product as Stripe.Product;
        const matchingCartItem = cartItems.find(
          (ci) => ci.sku === product.metadata?.sku
        );

        const item: any = {
          id: lineItem.id,
          productId: product.metadata?.productId || '',
          variantId: product.metadata?.variantId || '',
          title: lineItem.description || product.name,
          sku: product.metadata?.sku || '',
          qty: lineItem.quantity || 1,
          unitPrice: lineItem.price?.unit_amount || 0,
          imageUrl: matchingCartItem?.imageUrl || product.images?.[0] || '',
        };

        // Only add size and color if they exist (avoid undefined)
        if (matchingCartItem?.size) {
          item.size = matchingCartItem.size;
        }
        if (matchingCartItem?.color) {
          item.color = matchingCartItem.color;
        }

        return item;
      }),
      
      // Financial details (all in cents)
      subtotal,
      shipping,
      tax,
      total,
      currency: session.currency?.toUpperCase() || 'USD',
      
      // Status
      status: 'PAID',
      fulfillmentStatus: 'PENDING', // 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'
      
      // Fulfillment method (from metadata)
      fulfillmentMethod: (session.metadata?.fulfillmentMethod || 'shipping') as 'pickup' | 'local_delivery' | 'shipping',
      
      // Metadata
      metadata: session.metadata || {},
      
      // Timestamps - use Timestamp.now() for immediate, consistent timestamps
      // CRITICAL: Always set timestamps - never allow null/undefined
      createdAt: (() => {
        const ts = Timestamp.now();
        console.log('📅 Created timestamp object:', ts);
        console.log('📅 Created timestamp date:', ts?.toDate?.()?.toISOString());
        console.log('📅 Created timestamp type:', typeof ts);
        console.log('📅 Created timestamp has toDate:', typeof ts?.toDate === 'function');
        return ts;
      })(),
      updatedAt: Timestamp.now(),
      paidAt: Timestamp.now(),
    };

    // Remove all undefined values before saving to Firestore
    const cleanedOrderData = removeUndefined(orderData);
    
    // CRITICAL: Verify timestamps are still present after cleaning
    console.log('🔍 After removeUndefined - createdAt exists:', !!cleanedOrderData.createdAt);
    console.log('🔍 After removeUndefined - createdAt type:', typeof cleanedOrderData.createdAt);
    console.log('🔍 After removeUndefined - createdAt value:', cleanedOrderData.createdAt);
    console.log('🔍 After removeUndefined - createdAt has toDate:', typeof cleanedOrderData.createdAt?.toDate === 'function');
    
    // FORCE timestamps if they're missing (safety check)
    if (!cleanedOrderData.createdAt) {
      console.error('❌ CRITICAL: createdAt is missing after removeUndefined! Setting it now...');
      cleanedOrderData.createdAt = Timestamp.now();
    }
    if (!cleanedOrderData.updatedAt) {
      cleanedOrderData.updatedAt = Timestamp.now();
    }
    if (!cleanedOrderData.paidAt) {
      cleanedOrderData.paidAt = Timestamp.now();
    }

    // Save to Firebase
    console.log('📦 Step 2: Initializing Firebase...');
    let db;
    try {
      db = adminDb();
      console.log('✅ Step 2: Firebase initialized');
    } catch (firebaseError: any) {
      console.error('❌ Firebase initialization failed:', firebaseError);
      console.error('❌ Error message:', firebaseError?.message);
      console.error('❌ Check FIREBASE_SERVICE_ACCOUNT_JSON in Render environment variables');
      throw new Error(`Firebase initialization failed: ${firebaseError?.message}`);
    }
    
    console.log('📦 Step 3: Calculating order weight...');
    try {
      // Calculate order weight (this requires the order items to be structured)
      const tempOrder = cleanedOrderData as any;
      const orderWeight = await calculateOrderWeight(tempOrder);
      cleanedOrderData.total_weight_grams = orderWeight;
      console.log('✅ Order weight calculated:', orderWeight, 'grams');
    } catch (weightError: any) {
      console.warn('⚠️ Failed to calculate order weight:', weightError?.message);
      // Don't fail the order if weight calculation fails - use default in label creation
    }
    
    console.log('📦 Step 4: Saving order to Firebase...');
    console.log('📦 Step 4: Order data to save:', JSON.stringify({
      ...cleanedOrderData,
      items: cleanedOrderData.items?.map((item: any) => ({
        title: item.title,
        qty: item.qty,
        unitPrice: item.unitPrice,
      })),
      createdAt: cleanedOrderData.createdAt?.toDate?.()?.toISOString() || 'Timestamp object',
      updatedAt: cleanedOrderData.updatedAt?.toDate?.()?.toISOString() || 'Timestamp object',
      paidAt: cleanedOrderData.paidAt?.toDate?.()?.toISOString() || 'Timestamp object',
    }, null, 2));
    
    // FINAL SAFETY CHECK: Ensure timestamps are ALWAYS set right before saving
    // This is the last line of defense - timestamps MUST exist here
    const now = Timestamp.now();
    cleanedOrderData.createdAt = cleanedOrderData.createdAt || now;
    cleanedOrderData.updatedAt = cleanedOrderData.updatedAt || now;
    cleanedOrderData.paidAt = cleanedOrderData.paidAt || now;
    
    // Verify one more time
    if (!cleanedOrderData.createdAt || !cleanedOrderData.updatedAt || !cleanedOrderData.paidAt) {
      console.error('❌ CRITICAL ERROR: Timestamps are STILL missing right before save!');
      console.error('❌ createdAt:', cleanedOrderData.createdAt);
      console.error('❌ updatedAt:', cleanedOrderData.updatedAt);
      console.error('❌ paidAt:', cleanedOrderData.paidAt);
      // Force set them
      cleanedOrderData.createdAt = now;
      cleanedOrderData.updatedAt = now;
      cleanedOrderData.paidAt = now;
    }
    
    console.log('✅ FINAL CHECK: Timestamps confirmed before save');
    console.log('✅ createdAt:', cleanedOrderData.createdAt?.toDate?.()?.toISOString());
    console.log('✅ updatedAt:', cleanedOrderData.updatedAt?.toDate?.()?.toISOString());
    console.log('✅ paidAt:', cleanedOrderData.paidAt?.toDate?.()?.toISOString());
    
    let orderRef;
    try {
      orderRef = await db.collection('orders').add(cleanedOrderData);
      console.log('✅ Step 4: Order created in Firebase');
      console.log('✅ Step 4: Order ID:', orderRef.id);
      console.log('✅ Step 4: Order document path:', orderRef.path);
      
      // Verify the order was actually saved WITH TIMESTAMPS
      const verifyDoc = await orderRef.get();
      if (verifyDoc.exists) {
        const savedData = verifyDoc.data();
        console.log('✅ Step 4: Order verification - Document exists');
        console.log('✅ Step 4: Order verification - Document ID:', verifyDoc.id);
        console.log('✅ Step 4: Order verification - Status:', savedData?.status);
        console.log('✅ Step 4: Order verification - Items count:', savedData?.items?.length);
        
        // CRITICAL: Verify timestamps were saved
        console.log('🔍 TIMESTAMP VERIFICATION:');
        console.log('🔍 createdAt exists:', !!savedData?.createdAt);
        console.log('🔍 createdAt type:', typeof savedData?.createdAt);
        console.log('🔍 createdAt constructor:', savedData?.createdAt?.constructor?.name);
        console.log('🔍 createdAt has toDate:', typeof savedData?.createdAt?.toDate === 'function');
        console.log('🔍 createdAt value:', savedData?.createdAt);
        if (savedData?.createdAt?.toDate) {
          console.log('🔍 createdAt as ISO:', savedData.createdAt.toDate().toISOString());
        } else {
          console.error('❌ CRITICAL: createdAt is NOT a valid Timestamp!');
        }
        
        if (!savedData?.createdAt) {
          console.error('❌ CRITICAL ERROR: Order was saved WITHOUT createdAt timestamp!');
          console.error('❌ This order will show N/A in admin panel!');
          // Try to fix it immediately
          try {
            await orderRef.update({
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
              paidAt: Timestamp.now(),
            });
            console.log('✅ Fixed timestamps after save');
          } catch (fixError) {
            console.error('❌ Failed to fix timestamps:', fixError);
          }
        }
      } else {
        console.error('❌ Step 4: Order verification FAILED - Document does not exist!');
      }
    } catch (saveError: any) {
      console.error('❌ Step 4: FAILED to save order to Firebase');
      console.error('❌ Step 4: Error type:', saveError?.constructor?.name);
      console.error('❌ Step 4: Error message:', saveError?.message);
      console.error('❌ Step 4: Error stack:', saveError?.stack);
      console.error('❌ Step 4: Full error:', JSON.stringify(saveError, Object.getOwnPropertyNames(saveError), 2));
      throw saveError;
    }

    // Decrement inventory for all items in the order
    console.log('📦 ===== INVENTORY MANAGEMENT =====');
    console.log('📦 Decrementing inventory for', cleanedOrderData.items.length, 'items');
    try {
      const inventoryResult = await decrementInventoryForOrder(
        cleanedOrderData.items.map((item: any) => ({
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
        // Log errors but don't fail the webhook - inventory can be manually adjusted
      } else {
        console.log('✅ Inventory decremented successfully for all items');
      }
    } catch (inventoryError: any) {
      console.error('❌ Inventory decrement failed:', inventoryError);
      console.error('❌ Error message:', inventoryError?.message);
      console.error('❌ Error stack:', inventoryError?.stack);
      // Don't fail the webhook if inventory update fails - can be fixed manually
      // This prevents Stripe from retrying the webhook
    }

    // Send order confirmation email
    console.log('📧 ===== EMAIL SENDING STARTED =====');
    console.log('📧 Timestamp:', new Date().toISOString());
    console.log('📧 Customer email:', customerEmail);
    console.log('📧 Customer name:', customerName);
    console.log('📧 Order ID:', orderRef.id);
    console.log('📧 Order number:', orderRef.id.slice(-8).toUpperCase());
    console.log('📧 Environment variables check:');
    console.log('  - RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('  - RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
    console.log('  - RESEND_API_KEY starts with "re_":', process.env.RESEND_API_KEY?.startsWith('re_') || false);
    console.log('  - RESEND_API_KEY first 10 chars:', process.env.RESEND_API_KEY?.substring(0, 10) || 'NOT SET');
    console.log('  - FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');
    console.log('  - REPLY_TO_EMAIL:', process.env.REPLY_TO_EMAIL || 'NOT SET');
    
    if (!customerEmail) {
      console.error('❌ ===== NO CUSTOMER EMAIL - CANNOT SEND EMAIL =====');
      console.error('❌ Session customer_email:', session.customer_email);
      console.error('❌ Session customer_details:', JSON.stringify(session.customer_details, null, 2));
      console.error('❌ Skipping email send - no email address available');
    } else if (!process.env.RESEND_API_KEY) {
      console.error('❌ ===== RESEND_API_KEY NOT CONFIGURED =====');
      console.error('❌ Cannot send email - RESEND_API_KEY missing in environment variables');
      console.error('❌ Add RESEND_API_KEY to Render environment variables');
    } else {
      // Map fulfillment method for email (email expects 'delivery' or 'pickup')
      const orderFulfillmentMethod = cleanedOrderData.fulfillmentMethod || 'shipping';
      const emailFulfillmentMethod = 
        orderFulfillmentMethod === 'pickup' ? 'pickup' : 'delivery'; // 'shipping' and 'local_delivery' both map to 'delivery'
      
      console.log('📧 Order fulfillment method:', orderFulfillmentMethod);
      console.log('📧 Email fulfillment method:', emailFulfillmentMethod);
      console.log('📧 Order items count:', cleanedOrderData.items.length);
      console.log('📧 Items summary:', JSON.stringify(cleanedOrderData.items.map((item: any) => ({
        title: item.title,
        qty: item.qty,
        unitPrice: item.unitPrice,
        hasImage: !!item.imageUrl,
      })), null, 2));
      
      console.log('📧 Preparing email data...');
      const emailData = {
        customerEmail,
        customerName: customerName || 'Customer',
        orderId: orderRef.id,
        orderNumber: orderRef.id.slice(-8).toUpperCase(),
        items: cleanedOrderData.items.map((item: any) => ({
          title: item.title,
          qty: item.qty,
          unitPrice: item.unitPrice,
          imageUrl: item.imageUrl,
          sku: item.sku, // Added SKU
          size: item.size, // Added size
          color: item.color, // Added color
        })),
        subtotal: cleanedOrderData.subtotal,
        shipping: cleanedOrderData.shipping,
        tax: cleanedOrderData.tax,
        total: cleanedOrderData.total,
        currency: cleanedOrderData.currency,
        fulfillmentMethod: emailFulfillmentMethod as 'pickup' | 'delivery',
        shippingAddress: cleanedOrderData.shippingAddress || undefined,
      };
      
      console.log('📧 Email data prepared:', JSON.stringify({
        ...emailData,
        items: emailData.items.map((i: any) => ({ ...i, imageUrl: i.imageUrl ? 'SET' : 'NOT SET' })),
      }, null, 2));
      
      try {
        console.log('📧 Calling sendOrderConfirmationEmail function...');
        const startTime = Date.now();
        const emailResult = await sendOrderConfirmationEmail(emailData);
        const duration = Date.now() - startTime;
        
        console.log('📧 Email function completed in', duration, 'ms');
        console.log('📧 Email result:', JSON.stringify(emailResult, null, 2));
        
        if (emailResult.success) {
          console.log('✅ ===== EMAIL SENT SUCCESSFULLY =====');
          console.log('✅ Order confirmation email sent successfully to:', customerEmail);
          console.log('✅ Email ID:', emailResult.emailId);
          console.log('✅ Timestamp:', new Date().toISOString());
          console.log('✅ Duration:', duration, 'ms');
          
          // Send admin notification email
          console.log('📧 Sending admin notification email...');
          try {
            const adminResult = await sendAdminOrderNotification(emailData);
            if (adminResult.success) {
              console.log('✅ Admin notification email sent successfully');
              console.log('✅ Admin Email ID:', adminResult.emailId);
            } else {
              console.error('⚠️ Admin notification failed (non-critical):', adminResult.error);
            }
          } catch (adminError: any) {
            console.error('⚠️ Admin notification exception (non-critical):', adminError?.message);
          }
        } else {
          console.error('❌ ===== EMAIL SEND FAILED =====');
          console.error('❌ Failed to send order confirmation email');
          console.error('❌ Error:', emailResult.error);
          console.error('❌ Duration:', duration, 'ms');
          console.error('❌ Troubleshooting steps:');
          console.error('  1. Check RESEND_API_KEY in Render environment variables');
          console.error('  2. Check Resend dashboard for domain verification');
          console.error('  3. Check Resend dashboard for API key validity');
          console.error('  4. Check spam folder for test emails');
          console.error('  5. Verify FROM_EMAIL domain is verified in Resend');
          // Don't throw - allow webhook to succeed even if email fails
          // This prevents Stripe from retrying and spamming logs
        }
      } catch (error: any) {
        console.error('❌ ===== EMAIL SEND EXCEPTION =====');
        console.error('❌ Exception type:', error?.constructor?.name);
        console.error('❌ Error message:', error?.message);
        console.error('❌ Error stack:', error?.stack);
        console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        // Don't throw - allow webhook to succeed even if email fails
        console.error('⚠️ Email failed but webhook will return success to prevent Stripe retries');
      }
    }

    // Create shipping artifacts (labels) for the order
    console.log('📦 ===== CREATING SHIPPING ARTIFACTS =====');
    try {
      const artifactsResult = await createShippingArtifactsForOrder(orderRef.id);
      
      if (artifactsResult.success && artifactsResult.labelCreated) {
        console.log('✅ Shipping artifacts created successfully');
        if (artifactsResult.labelUrl) {
          console.log('✅ Label URL:', artifactsResult.labelUrl);
        }
        if (artifactsResult.trackingNumber) {
          console.log('✅ Tracking number:', artifactsResult.trackingNumber);
        }
        if (artifactsResult.internalLabelUrl) {
          console.log('✅ Internal label URL:', artifactsResult.internalLabelUrl);
        }
      } else if (artifactsResult.success && !artifactsResult.labelCreated) {
        console.log('ℹ️ Label already exists for this order (idempotency check passed)');
      } else {
        console.error('❌ Failed to create shipping artifacts:', artifactsResult.error);
        // Don't throw - allow webhook to succeed even if label creation fails
        // The label can be created manually later via admin UI
      }
    } catch (labelError: any) {
      console.error('❌ Error creating shipping artifacts:', labelError);
      console.error('❌ Error message:', labelError?.message);
      console.error('❌ Error stack:', labelError?.stack);
      // Don't throw - allow webhook to succeed even if label creation fails
      // The label can be created manually later via admin UI
    }

    // TODO: Update product inventory
    // TODO: Notify admin of new order

    console.log('✅ ===== ORDER CREATION COMPLETE =====');
    console.log('✅ Order ID:', orderRef.id);
    console.log('✅ Order Status:', cleanedOrderData.status);
    console.log('✅ Customer Email:', customerEmail);
    console.log('✅ Fulfillment Method:', cleanedOrderData.fulfillmentMethod);
    console.log('✅ Total Amount:', cleanedOrderData.total, 'cents');
    console.log('✅ Items Count:', cleanedOrderData.items.length);
    console.log('✅ Timestamp:', new Date().toISOString());
    
    // Verify order is queryable
    try {
      const verifyQuery = await db.collection('orders').where('stripeSessionId', '==', session.id).limit(1).get();
      if (verifyQuery.empty) {
        console.error('❌ WARNING: Order not found when querying by stripeSessionId!');
        console.error('❌ This might indicate a Firestore write issue');
      } else {
        console.log('✅ Order verification: Found order when querying by stripeSessionId');
        const foundDoc = verifyQuery.docs[0];
        console.log('✅ Order verification: Found order ID:', foundDoc.id);
        console.log('✅ Order verification: Matches created order?', foundDoc.id === orderRef.id);
      }
    } catch (verifyError: any) {
      console.error('❌ Order verification query failed:', verifyError?.message);
    }

    return orderRef.id;

  } catch (error) {
    console.error('❌ Error handling checkout session:', error);
    throw error;
  }
}

