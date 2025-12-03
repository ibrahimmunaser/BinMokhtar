/**
 * Geocoding utilities using Google Maps API
 */

export interface GeocodedAddress {
  formattedAddress: string;
  street?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat: number;
  lng: number;
}

export interface GeocodeError {
  code: 'INVALID_ADDRESS' | 'API_ERROR' | 'NO_RESULTS' | 'MISSING_API_KEY';
  message: string;
}

/**
 * Geocode an address string to coordinates and structured address
 * This function should only be called from the server side
 */
export async function geocodeAddress(
  address: string
): Promise<{ success: true; data: GeocodedAddress } | { success: false; error: GeocodeError }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Google Maps API key is not configured',
      },
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const components = result.address_components;

      // Extract address components
      const getComponent = (type: string): string => {
        const component = components.find((c: any) => c.types.includes(type));
        return component?.long_name || component?.short_name || '';
      };

      const getShortComponent = (type: string): string => {
        const component = components.find((c: any) => c.types.includes(type));
        return component?.short_name || '';
      };

      return {
        success: true,
        data: {
          formattedAddress: result.formatted_address,
          street: `${getComponent('street_number')} ${getComponent('route')}`.trim() || undefined,
          city: getComponent('locality') || getComponent('sublocality') || getComponent('administrative_area_level_2'),
          state: getShortComponent('administrative_area_level_1'),
          zip: getComponent('postal_code'),
          country: getShortComponent('country'),
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
      };
    }

    if (data.status === 'ZERO_RESULTS') {
      return {
        success: false,
        error: {
          code: 'NO_RESULTS',
          message: 'No results found for this address. Please check and try again.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INVALID_ADDRESS',
        message: `Geocoding failed: ${data.status}`,
      },
    };
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Failed to geocode address',
      },
    };
  }
}

/**
 * Reverse geocode coordinates to address
 * Useful for geolocation results
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ success: true; data: GeocodedAddress } | { success: false; error: GeocodeError }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Google Maps API key is not configured',
      },
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const components = result.address_components;

      const getComponent = (type: string): string => {
        const component = components.find((c: any) => c.types.includes(type));
        return component?.long_name || component?.short_name || '';
      };

      const getShortComponent = (type: string): string => {
        const component = components.find((c: any) => c.types.includes(type));
        return component?.short_name || '';
      };

      return {
        success: true,
        data: {
          formattedAddress: result.formatted_address,
          street: `${getComponent('street_number')} ${getComponent('route')}`.trim() || undefined,
          city: getComponent('locality') || getComponent('sublocality') || getComponent('administrative_area_level_2'),
          state: getShortComponent('administrative_area_level_1'),
          zip: getComponent('postal_code'),
          country: getShortComponent('country'),
          lat,
          lng,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'NO_RESULTS',
        message: 'Could not determine address from coordinates',
      },
    };
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Failed to reverse geocode',
      },
    };
  }
}

