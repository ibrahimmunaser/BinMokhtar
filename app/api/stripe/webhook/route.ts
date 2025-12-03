import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe/config';
import { adminDb } from '@/lib/firebase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';
import Stripe from 'stripe';

// Mark as dynamic route (webhooks are always dynamic)
export const dynamic = 'force-dynamic';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';

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
  
  let body: string;
  try {
    body = await request.text();
    console.log('📥 Body received, length:', body.length);
  } catch (error: any) {
    console.error('❌ Error reading request body:', error);
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }
  
  const signature = request.headers.get('stripe-signature');
  console.log('📥 Signature present:', !!signature);
  console.log('📥 STRIPE_WEBHOOK_SECRET exists:', !!STRIPE_WEBHOOK_SECRET);
  console.log('📥 STRIPE_WEBHOOK_SECRET length:', STRIPE_WEBHOOK_SECRET?.length || 0);
  console.log('📥 STRIPE_WEBHOOK_SECRET first 10 chars:', STRIPE_WEBHOOK_SECRET?.substring(0, 10) || 'NOT SET');
  console.log('📥 STRIPE_WEBHOOK_SECRET last 10 chars:', STRIPE_WEBHOOK_SECRET?.substring(STRIPE_WEBHOOK_SECRET.length - 10) || 'NOT SET');

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

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    console.log('🔐 Attempting to verify webhook signature...');
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook signature verified successfully');
  } catch (err: any) {
    console.error('❌ ===== WEBHOOK SIGNATURE VERIFICATION FAILED =====');
    console.error('❌ Error message:', err.message);
    console.error('❌ This usually means:');
    console.error('   1. STRIPE_WEBHOOK_SECRET in Render does not match Stripe Dashboard');
    console.error('   2. Webhook secret was rolled/changed in Stripe but not updated in Render');
    console.error('   3. Wrong webhook endpoint (using secret from different webhook)');
    console.error('❌ Expected secret from Stripe Dashboard:', 'whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84');
    console.error('❌ Check Render environment variable STRIPE_WEBHOOK_SECRET matches exactly');
    return NextResponse.json({ 
      error: `Webhook Error: ${err.message}`,
      hint: 'Check that STRIPE_WEBHOOK_SECRET in Render matches the signing secret in Stripe Dashboard'
    }, { status: 400 });
  }

  console.log('✅ Received Stripe webhook event:', event.type);
  console.log('📋 Event ID:', event.id);
  console.log('📋 Event created:', new Date(event.created * 1000).toISOString());

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

    // Parse cart items from metadata
    const cartItemsStr = session.metadata?.cartItems;
    let cartItems: any[] = [];
    
    if (cartItemsStr) {
      try {
        cartItems = JSON.parse(cartItemsStr);
      } catch (e) {
        console.error('Failed to parse cart items from metadata');
      }
    }

    // Extract customer details
    const customerEmail = session.customer_details?.email || session.customer_email || '';
    const customerName = session.customer_details?.name || '';
    const shippingAddress = session.shipping_details?.address;
    const billingAddress = session.customer_details?.address;

    // Calculate totals (amounts are in cents)
    const subtotal = session.amount_subtotal || 0;
    const total = session.amount_total || 0;
    const shipping = (session.shipping_cost?.amount_total || 0);
    const tax = (session.total_details?.amount_tax || 0);

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
      
      // Order items
      items: fullSession.line_items?.data.map((lineItem) => {
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
      }) || [],
      
      // Financial details (all in cents)
      subtotal,
      shipping,
      tax,
      total,
      currency: session.currency?.toUpperCase() || 'USD',
      
      // Status
      status: 'PAID',
      fulfillmentStatus: 'PENDING', // 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'
      
      // Metadata
      metadata: session.metadata || {},
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: new Date(),
    };

    // Remove all undefined values before saving to Firestore
    const cleanedOrderData = removeUndefined(orderData);

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
    
    console.log('📦 Step 3: Saving order to Firebase...');
    const orderRef = await db.collection('orders').add(cleanedOrderData);
    console.log('✅ Step 3: Order created in Firebase:', orderRef.id);

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
      const fulfillmentMethod = (session.metadata?.fulfillmentMethod || 'delivery') as 'delivery' | 'pickup';
      
      console.log('📧 Fulfillment method:', fulfillmentMethod);
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
        })),
        subtotal: cleanedOrderData.subtotal,
        shipping: cleanedOrderData.shipping,
        tax: cleanedOrderData.tax,
        total: cleanedOrderData.total,
        currency: cleanedOrderData.currency,
        fulfillmentMethod,
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

    // TODO: Update product inventory
    // TODO: Notify admin of new order

    return orderRef.id;

  } catch (error) {
    console.error('❌ Error handling checkout session:', error);
    throw error;
  }
}

