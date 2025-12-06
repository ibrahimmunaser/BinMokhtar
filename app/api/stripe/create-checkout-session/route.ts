import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import Stripe from 'stripe';

// Mark as dynamic route (uses request body)
export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout session with cart items
 */
export async function POST(request: NextRequest) {
  // Validate Stripe key at runtime
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { items, customerEmail, userId, metadata } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    // Convert cart items to Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      const unitAmount = item.priceAtAdd || item.price || 0; // Already in cents
      const title = item.title || item.name || 'Product';
      const description = [item.size, item.color].filter(Boolean).join(' • ');

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: title,
            description: description || undefined,
            images: item.imageUrl ? [item.imageUrl] : undefined,
            metadata: {
              productId: item.productId,
              variantId: item.variantId,
              sku: item.sku,
            },
          },
          unit_amount: unitAmount, // Price in cents
        },
        quantity: item.qty,
      };
    });

    // Add shipping cost as a line item if it exists
    const shippingAmountRaw = metadata?.shippingAmount;
    const shippingAmount = shippingAmountRaw 
      ? (typeof shippingAmountRaw === 'number' ? shippingAmountRaw : parseInt(String(shippingAmountRaw), 10))
      : 0;
    
    console.log('📦 Shipping cost check:', {
      shippingAmountRaw,
      shippingAmount,
      fulfillmentMethod: metadata?.fulfillmentMethod,
      hasMetadata: !!metadata,
    });
    
    if (shippingAmount > 0 && !isNaN(shippingAmount)) {
      const fulfillmentMethod = metadata?.fulfillmentMethod || 'shipping';
      let shippingLabel = 'Shipping';
      
      if (fulfillmentMethod === 'local_delivery') {
        shippingLabel = 'Local Delivery';
      } else if (fulfillmentMethod === 'shipping' && metadata?.shippingCarrier && metadata?.shippingService) {
        shippingLabel = `Shipping (${metadata.shippingCarrier} ${metadata.shippingService})`;
      } else if (fulfillmentMethod === 'shipping' && metadata?.shippingCarrier) {
        shippingLabel = `Shipping (${metadata.shippingCarrier})`;
      }
      
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: shippingLabel,
            description: 'Shipping and handling',
          },
          unit_amount: shippingAmount, // Already in cents
        },
        quantity: 1,
      });
      
      console.log('✅ Added shipping as line item:', {
        label: shippingLabel,
        amount: shippingAmount,
        fulfillmentMethod,
      });
    } else {
      console.log('ℹ️ No shipping cost to add (amount:', shippingAmount, ')');
    }

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';

    // Create Checkout Session with custom branding
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      customer_email: customerEmail || undefined,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM'], // Add your shipping countries
      },
      metadata: {
        ...metadata,
        userId: userId || undefined, // Link order to user if authenticated
        cartItems: JSON.stringify(items.map((i: any) => ({
          productId: i.productId,
          variantId: i.variantId,
          sku: i.sku,
          qty: i.qty,
        }))),
      },
      allow_promotion_codes: true, // Enable promo codes
      billing_address_collection: 'required',
      // Custom appearance to match your brand
      ui_mode: 'hosted', // Use Stripe's hosted checkout page
      locale: 'auto', // Auto-detect user's locale (more reliable than hardcoding 'en')
      // Note: For more advanced customization, configure branding in Stripe Dashboard:
      // Dashboard > Settings > Branding > Checkout appearance
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error: any) {
    console.error('Stripe Checkout Session Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

