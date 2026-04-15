/**
 * Shipping & Delivery Configuration
 */

// Store location coordinates (Taylor, Michigan)
export const STORE_COORDINATES = {
  lat: parseFloat(process.env.STORE_LAT || '42.23870'),
  lng: parseFloat(process.env.STORE_LNG || '-83.26968'),
};

// Store address
export const STORE_ADDRESS = {
  name: 'Bin Mukhtar Retail',
  street1: '15600 Michael St',
  city: 'Taylor',
  state: 'MI',
  zip: '48180',
  country: 'US',
  phone: '+1 734-785-2726',
  email: 'support@binmukhtarretail.com',
};

// Delivery radius for local delivery (in miles)
export const LOCAL_DELIVERY_RADIUS_MILES = parseFloat(
  process.env.DELIVERY_RADIUS_MILES || '15'
);

// Local delivery flat fee (in cents)
export const LOCAL_DELIVERY_FEE_CENTS = 300; // $3.00

// Standard shipping flat fee (in cents)
export const STANDARD_SHIPPING_FEE_CENTS = 999; // $9.99

// The single flat-rate shipping option shown at checkout
export const FLAT_SHIPPING_RATE: ShippingRate = {
  id: 'standard-flat-rate',
  carrier: 'Standard',
  serviceLevelName: 'Shipping',
  amount: STANDARD_SHIPPING_FEE_CENTS,
};

// Fulfillment method types
export type FulfillmentMethod = 'pickup' | 'local_delivery' | 'shipping';

// Zone types based on distance
export type DeliveryZone = 'local' | 'standard';

// Location source types
export type LocationSource = 'geolocation' | 'manual';

// LocationZone object structure
export interface LocationZone {
  formattedAddress: string;
  street?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  zone: DeliveryZone;
  source: LocationSource;
}

// Simplified shipping rate
export interface ShippingRate {
  id: string;
  carrier: string;
  serviceLevelName: string;
  amount: number; // in cents
}

// Order fulfillment data
export interface OrderFulfillment {
  method: FulfillmentMethod;
  locationZone: LocationZone;
  shippingAmount?: number; // in cents
  localDeliveryFee?: number; // in cents
  packingSlipUrl?: string;
}

// Helper to get fulfillment method display name
export function getFulfillmentMethodLabel(method: FulfillmentMethod): string {
  switch (method) {
    case 'pickup':
      return 'Pickup';
    case 'local_delivery':
      return 'Local Delivery';
    case 'shipping':
      return 'Shipping';
    default:
      return 'Unknown';
  }
}

// Helper to get zone display text
export function getZoneDisplayText(zone: DeliveryZone, city?: string, state?: string): string {
  const location = city && state ? `${city}, ${state}` : 'your location';

  if (zone === 'local') {
    return `Delivering to ${location} · Local delivery available ($3)`;
  }
  return `Delivering to ${location} · Standard shipping ($9.99)`;
}
