import { NextRequest, NextResponse } from 'next/server';
import { getShippingRates } from '@/lib/shipping/shippo';
import type { LocationZone, ShippingCartItem } from '@/lib/shipping/config';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shipping/rates
 * 
 * Get shipping rates from Shippo for a destination and cart items
 * 
 * Request body:
 * - destination: LocationZone object
 * - items: Array of cart items with weight/dimensions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destination, items } = body;

    // Validate destination
    if (!destination || !destination.city || !destination.state || !destination.zip) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Valid destination address is required' 
        },
        { status: 400 }
      );
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cart items are required' 
        },
        { status: 400 }
      );
    }

    console.log('📦 Fetching shipping rates for:', destination.city, destination.state);

    // Convert cart items to shipping items
    const shippingItems: ShippingCartItem[] = items.map((item: any) => ({
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku || '',
      name: item.name || item.title || '',
      qty: item.qty || 1,
      weight: item.weight, // Optional - will use default if not provided
      dimensions: item.dimensions, // Optional
    }));

    // Get rates from Shippo
    const rates = await getShippingRates(destination as LocationZone, shippingItems);

    console.log('✅ Got', rates.length, 'shipping rates');

    return NextResponse.json({
      success: true,
      rates,
    });

  } catch (error: any) {
    console.error('❌ Shipping rates error:', error);
    
    // Check for Shippo API key error
    if (error.message?.includes('SHIPPO_API_TOKEN')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Shipping service is not configured. Please contact support.',
          rates: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get shipping rates',
        rates: [],
      },
      { status: 500 }
    );
  }
}

