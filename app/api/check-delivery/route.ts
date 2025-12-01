import { NextRequest, NextResponse } from 'next/server';

// Mark as dynamic route (uses request body)
export const dynamic = 'force-dynamic';

// Haversine formula to calculate distance between two coordinates
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Geocode an address using Google Maps Geocoding API
async function geocodeAddress(address: string): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.results.length > 0) {
    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  }

  return null;
}

/**
 * POST /api/check-delivery
 * Checks if an address is within delivery radius
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, lat, lng } = body;

    console.log('📍 Check delivery request:', { address, lat, lng });

    // Validate environment variables
    const storeLat = parseFloat(process.env.STORE_LAT || '');
    const storeLng = parseFloat(process.env.STORE_LNG || '');
    const deliveryRadius = parseFloat(process.env.DELIVERY_RADIUS_MILES || '');

    console.log('🏪 Store config:', { storeLat, storeLng, deliveryRadius });

    if (!storeLat || !storeLng || !deliveryRadius) {
      const missing = [];
      if (!storeLat) missing.push('STORE_LAT');
      if (!storeLng) missing.push('STORE_LNG');
      if (!deliveryRadius) missing.push('DELIVERY_RADIUS_MILES');
      
      console.error('❌ Missing environment variables:', missing);
      return NextResponse.json(
        {
          isDeliverable: false,
          error: `Server configuration error: Missing ${missing.join(', ')}. Please set these in Render environment variables.`,
        },
        { status: 500 }
      );
    }

    let customerLat: number;
    let customerLng: number;
    let normalizedAddress: string;

    // If lat/lng provided, use them directly
    if (lat && lng) {
      console.log('✅ Using provided coordinates:', { lat, lng });
      customerLat = lat;
      customerLng = lng;
      normalizedAddress = address || 'Provided coordinates';
    } else if (address) {
      // Otherwise, geocode the address
      console.log('🌍 Geocoding address:', address);
      const geocoded = await geocodeAddress(address);

      if (!geocoded) {
        console.error('❌ Geocoding failed for address:', address);
        return NextResponse.json(
          {
            isDeliverable: false,
            error: 'Could not geocode address. Please enter a valid address and select it from the dropdown.',
          },
          { status: 400 }
        );
      }

      console.log('✅ Geocoded successfully:', geocoded);
      customerLat = geocoded.lat;
      customerLng = geocoded.lng;
      normalizedAddress = geocoded.formattedAddress;
    } else {
      console.error('❌ No address or coordinates provided');
      return NextResponse.json(
        {
          isDeliverable: false,
          error: 'Address or coordinates required',
        },
        { status: 400 }
      );
    }

    // Calculate distance using Haversine formula
    const distanceMiles = haversineDistance(
      storeLat,
      storeLng,
      customerLat,
      customerLng
    );

    console.log('📏 Distance calculated:', distanceMiles, 'miles');

    // Check if within delivery radius
    const isDeliverable = distanceMiles <= deliveryRadius;

    console.log('✅ Delivery check complete:', { isDeliverable, distanceMiles, maxRadius: deliveryRadius });

    return NextResponse.json({
      isDeliverable,
      distanceMiles: Math.round(distanceMiles * 10) / 10, // Round to 1 decimal
      normalizedAddress,
      error: null,
      maxRadius: deliveryRadius,
    });
  } catch (error: any) {
    console.error('❌ Delivery check error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
    });

    return NextResponse.json(
      {
        isDeliverable: false,
        error: error.message || 'Failed to check delivery availability. Please try again or contact support.',
      },
      { status: 500 }
    );
  }
}

