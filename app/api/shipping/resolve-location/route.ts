import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, reverseGeocode } from '@/lib/shipping/geocoding';
import { calculateDistanceFromStore, getDeliveryZone } from '@/lib/shipping/distance';
import type { LocationZone, LocationSource } from '@/lib/shipping/config';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shipping/resolve-location
 * 
 * Resolves an address or coordinates to a LocationZone object
 * with distance calculation and zone classification.
 * 
 * Request body:
 * - { address: string } - for manual address entry
 * - { lat: number, lng: number } - for geolocation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, lat, lng } = body;

    console.log('📍 Resolve location request:');
    console.log('📍   address:', address);
    console.log('📍   lat:', lat);
    console.log('📍   lng:', lng);
    console.log('📍   Will use:', address ? 'ADDRESS (geocode)' : 'COORDINATES (reverse geocode)');

    let resolvedAddress: {
      formattedAddress: string;
      street?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      lat: number;
      lng: number;
    };
    let source: LocationSource;

    // PRIORITY: If address is provided, use it (even if lat/lng are also provided)
    // This preserves the exact address the user entered/selected
    // Case 1: Address string provided (from address input or Google Places selection)
    if (address && typeof address === 'string') {
      source = 'manual';
      
      // Geocode the address to get coordinates
      const result = await geocodeAddress(address);
      
      if (!result.success) {
        console.error('❌ Geocoding failed:', result.error);
        return NextResponse.json(
          { 
            success: false, 
            error: result.error.message 
          },
          { status: 400 }
        );
      }
      
      resolvedAddress = result.data;
      console.log('✅ Geocoded address:', resolvedAddress.formattedAddress);
      console.log('✅ Using address from user input, NOT reverse geocoding from coordinates');
    }
    // Case 2: Only coordinates provided (geolocation button)
    else if (typeof lat === 'number' && typeof lng === 'number') {
      source = 'geolocation';
      
      // Reverse geocode to get address details
      const result = await reverseGeocode(lat, lng);
      
      if (!result.success) {
        console.error('❌ Reverse geocoding failed:', result.error);
        return NextResponse.json(
          { 
            success: false, 
            error: result.error.message 
          },
          { status: 400 }
        );
      }
      
      resolvedAddress = result.data;
      console.log('✅ Reverse geocoded from coordinates:', resolvedAddress.formattedAddress);
    }
    // Case 3: Neither provided
    else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Either address or lat/lng coordinates are required' 
        },
        { status: 400 }
      );
    }

    // Calculate distance from store
    const distanceMiles = calculateDistanceFromStore(
      resolvedAddress.lat,
      resolvedAddress.lng
    );
    console.log('📏 Distance from store:', distanceMiles, 'miles');

    // Determine zone
    const zone = getDeliveryZone(distanceMiles);
    console.log('🗺️ Zone:', zone);

    // Build LocationZone object
    const locationZone: LocationZone = {
      formattedAddress: resolvedAddress.formattedAddress,
      street: resolvedAddress.street,
      city: resolvedAddress.city,
      state: resolvedAddress.state,
      zip: resolvedAddress.zip,
      country: resolvedAddress.country,
      lat: resolvedAddress.lat,
      lng: resolvedAddress.lng,
      distanceMiles,
      zone,
      source,
    };

    console.log('✅ Location resolved:');
    console.log('✅   formattedAddress:', locationZone.formattedAddress);
    console.log('✅   street:', locationZone.street);
    console.log('✅   city:', locationZone.city);
    console.log('✅   state:', locationZone.state);
    console.log('✅   zip:', locationZone.zip);
    console.log('✅   zone:', locationZone.zone);
    console.log('✅   distanceMiles:', locationZone.distanceMiles);

    return NextResponse.json({
      success: true,
      locationZone,
    });

  } catch (error: any) {
    console.error('❌ Resolve location error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to resolve location' 
      },
      { status: 500 }
    );
  }
}

