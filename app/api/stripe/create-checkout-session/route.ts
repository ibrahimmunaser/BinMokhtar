import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { adminDb } from '@/lib/firebase/server';
import Stripe from 'stripe';

// Mark as dynamic route (uses request body)
export const dynamic = 'force-dynamic';

/**
 * Validate stock for all items before checkout
 */
async function validateStock(items: any[]): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  for (const item of items) {
    try {
      const productDoc = await adminDb().collection('products').doc(item.productId).get();
      
      if (!productDoc.exists) {
        errors.push(`Product "${item.title || item.name}" is no longer available`);
        continue;
      }
      
      const productData = productDoc.data();
      
      // Check variant-level stock if size/color specified
      if (item.size || item.color) {
        const variantsSnap = await adminDb()
          .collection('products')
          .doc(item.productId)
          .collection('variants')
          .get();
        
        let variantFound = false;
        for (const variantDoc of variantsSnap.docs) {
          const variantData = variantDoc.data();
          const sizeMatch = !item.size || String(variantData.size ?? '').trim() === String(item.size).trim();
          const colorMatch = !item.color || String(variantData.color ?? '').trim() === String(item.color).trim();
          
          if (sizeMatch && colorMatch) {
            variantFound = true;
            const availableStock = variantData.stock || 0;
            
            if (availableStock < item.qty) {
              const variantDesc = [item.size, item.color].filter(Boolean).join(' / ');
              if (availableStock === 0) {
                errors.push(`"${item.title || item.name}" (${variantDesc}) is out of stock`);
              } else {
                errors.push(`"${item.title || item.name}" (${variantDesc}) only has ${availableStock} available (you requested ${item.qty})`);
              }
            }
            break;
          }
        }
        
        if (!variantFound) {
          const variantDesc = [item.size, item.color].filter(Boolean).join(' / ');
          errors.push(`"${item.title || item.name}" (${variantDesc}) is no longer available`);
        }
      } else {
        // Check product-level stock
        const totalStock = productData?.counts?.totalStock ?? productData?.stock ?? 0;
        
        if (totalStock < item.qty) {
          if (totalStock === 0) {
            errors.push(`"${item.title || item.name}" is out of stock`);
          } else {
            errors.push(`"${item.title || item.name}" only has ${totalStock} available (you requested ${item.qty})`);
          }
        }
      }
    } catch (error) {
      console.error(`Error validating stock for ${item.productId}:`, error);
      // Fail closed: block checkout if we cannot verify stock
      errors.push(`Unable to verify stock for "${item.title || item.name}". Please try again.`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

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

    // Validate stock before creating checkout session
    const stockValidation = await validateStock(items);
    if (!stockValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Some items in your cart are no longer available',
          stockErrors: stockValidation.errors 
        },
        { status: 400 }
      );
    }

    // Convert cart items to Stripe line items with validation
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any, index: number) => {
      const unitAmount = item.priceAtAdd || item.price || 0; // Already in cents
      const title = item.title || item.name || 'Product';
      const description = [item.size, item.color].filter(Boolean).join(' • ');

      // Validate price
      if (!unitAmount || unitAmount <= 0) {
        console.error(`❌ Item ${index} has invalid price:`, { item, unitAmount });
        throw new Error(`Invalid price for "${title}". Please refresh and try again.`);
      }

      // Validate quantity
      if (!item.qty || item.qty < 1) {
        console.error(`❌ Item ${index} has invalid quantity:`, { item });
        throw new Error(`Invalid quantity for "${title}".`);
      }

      // Log item for debugging
      console.log(`✅ Item ${index}:`, {
        title,
        price: unitAmount,
        qty: item.qty,
        size: item.size,
        color: item.color,
      });

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: title,
            description: description || undefined,
            images: item.imageUrl ? [item.imageUrl] : undefined,
            metadata: {
              productId: item.productId || '',
              variantId: item.variantId || '',
              sku: item.sku || '',
              // size and color stored here so webhook can decrement the correct variant
              // even when cartItemsSample is truncated by Stripe's 500-char limit
              size: item.size || '',
              color: item.color || '',
            },
          },
          unit_amount: Math.round(unitAmount), // Ensure integer
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
      shippingRateId: metadata?.shippingRateId,
      hasMetadata: !!metadata,
    });
    
    if (shippingAmount > 0 && !isNaN(shippingAmount)) {
      const fulfillmentMethod = metadata?.fulfillmentMethod || 'shipping';
      const shippingLabel = fulfillmentMethod === 'local_delivery' ? 'Local Delivery' : 'Standard Shipping';

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: shippingLabel,
            description: 'Shipping and handling',
          },
          unit_amount: shippingAmount,
        },
        quantity: 1,
      });

      console.log('✅ Added shipping as line item:', { label: shippingLabel, amount: shippingAmount });
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
        // cartItems stored as minimal JSON to avoid Stripe's 500 char metadata limit
        // With 5+ items, even minimal data can exceed limit, so we store item count only
        // Full cart data is in line_items and can be reconstructed from there in webhook
        itemCount: items.length.toString(),
        // Store first 3 items for reference (typically enough for most orders)
        cartItemsSample: JSON.stringify(items.slice(0, 3).map((i: any) => ({
          id: i.productId,
          v: i.variantId,
          q: i.qty,
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
    console.error('❌ Stripe Checkout Session Error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      stack: error.stack,
    });
    
    // Provide more specific error messages
    let userMessage = 'Failed to create checkout session';
    
    if (error.type === 'StripeInvalidRequestError') {
      if (error.message?.includes('amount')) {
        userMessage = 'Invalid price amount detected. Please contact support.';
      } else if (error.message?.includes('metadata')) {
        userMessage = 'Product information error. Please try again or contact support.';
      } else {
        userMessage = `Stripe error: ${error.message}`;
      }
    } else if (error.message?.includes('API key')) {
      userMessage = 'Payment system configuration error. Please contact support.';
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          type: error.type,
          code: error.code,
          param: error.param,
        } : undefined
      },
      { status: 500 }
    );
  }
}

