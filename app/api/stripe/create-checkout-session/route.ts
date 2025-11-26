import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import Stripe from 'stripe';

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout session with cart items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerEmail, metadata } = body;

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

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';

    // Create Checkout Session
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
        cartItems: JSON.stringify(items.map((i: any) => ({
          productId: i.productId,
          variantId: i.variantId,
          sku: i.sku,
          qty: i.qty,
        }))),
      },
      allow_promotion_codes: true, // Enable promo codes
      billing_address_collection: 'required',
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

