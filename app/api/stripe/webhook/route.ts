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
        console.log('🎉 Processing checkout.session.completed');
        console.log('📧 Session customer email:', session.customer_email);
        console.log('📧 Session customer_details:', session.customer_details);
        console.log('📧 Session metadata:', session.metadata);
        await handleCheckoutSessionCompleted(session);
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Error handling webhook:', error);
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

    // Create order in Firebase
    const orderData = {
      // Payment info
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      paymentStatus: session.payment_status, // 'paid', 'unpaid', or 'no_payment_required'
      
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

        return {
          id: lineItem.id,
          productId: product.metadata?.productId || '',
          variantId: product.metadata?.variantId || '',
          title: lineItem.description || product.name,
          sku: product.metadata?.sku || '',
          qty: lineItem.quantity || 1,
          unitPrice: lineItem.price?.unit_amount || 0,
          imageUrl: matchingCartItem?.imageUrl || product.images?.[0] || '',
          size: matchingCartItem?.size,
          color: matchingCartItem?.color,
        };
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
    const orderRef = await db.collection('orders').add(orderData);
    console.log('✅ Step 3: Order created in Firebase:', orderRef.id);

    // Send order confirmation email
    console.log('📧 ===== EMAIL SENDING STARTED =====');
    console.log('📧 Customer email:', customerEmail);
    console.log('📧 Customer name:', customerName);
    console.log('📧 Order ID:', orderRef.id);
    console.log('📧 Order number:', orderRef.id.slice(-8).toUpperCase());
    console.log('📧 Resend API key configured:', !!process.env.RESEND_API_KEY);
    console.log('📧 RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
    console.log('📧 RESEND_API_KEY starts with "re_":', process.env.RESEND_API_KEY?.startsWith('re_') || false);
    
    if (customerEmail) {
      const fulfillmentMethod = (session.metadata?.fulfillmentMethod || 'delivery') as 'delivery' | 'pickup';
      
      console.log('📧 Fulfillment method:', fulfillmentMethod);
      console.log('📧 Order items count:', orderData.items.length);
      console.log('📧 Items:', JSON.stringify(orderData.items.map(item => ({
        title: item.title,
        qty: item.qty,
        unitPrice: item.unitPrice,
      })), null, 2));
      
      try {
        console.log('📧 Calling sendOrderConfirmationEmail...');
        const emailResult = await sendOrderConfirmationEmail({
          customerEmail,
          customerName: customerName || 'Customer',
          orderId: orderRef.id,
          orderNumber: orderRef.id.slice(-8).toUpperCase(),
          items: orderData.items.map(item => ({
            title: item.title,
            qty: item.qty,
            unitPrice: item.unitPrice,
            imageUrl: item.imageUrl,
          })),
          subtotal: orderData.subtotal,
          shipping: orderData.shipping,
          tax: orderData.tax,
          total: orderData.total,
          currency: orderData.currency,
          fulfillmentMethod,
          shippingAddress: orderData.shippingAddress || undefined,
        });

        console.log('📧 Email result received:', JSON.stringify(emailResult, null, 2));
        
        if (emailResult.success) {
          console.log('✅ ===== EMAIL SENT SUCCESSFULLY =====');
          console.log('✅ Order confirmation email sent successfully to:', customerEmail);
          console.log('✅ Email ID:', emailResult.emailId);
          console.log('✅ Timestamp:', new Date().toISOString());
        } else {
          console.error('❌ ===== EMAIL SEND FAILED =====');
          console.error('❌ Failed to send order confirmation email');
          console.error('❌ Error:', emailResult.error);
          console.error('❌ Check RESEND_API_KEY in Render environment variables');
          console.error('❌ Check Resend dashboard for domain verification');
          console.error('❌ Check spam folder for test emails');
        }
      } catch (error: any) {
        console.error('❌ ===== EMAIL SEND EXCEPTION =====');
        console.error('❌ Exception type:', error?.constructor?.name);
        console.error('❌ Error message:', error?.message);
        console.error('❌ Error stack:', error?.stack);
        console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
    } else {
      console.warn('⚠️ No customer email found in session');
      console.warn('⚠️ Session customer_email:', session.customer_email);
      console.warn('⚠️ Session customer_details:', session.customer_details);
      console.warn('⚠️ Skipping order confirmation email');
    }

    // TODO: Update product inventory
    // TODO: Notify admin of new order

    return orderRef.id;

  } catch (error) {
    console.error('❌ Error handling checkout session:', error);
    throw error;
  }
}

