/**
 * Shipping & Delivery Configuration
 * Central configuration for all shipping-related settings
 */

// Store location coordinates (Taylor, Michigan)
export const STORE_COORDINATES = {
  lat: parseFloat(process.env.STORE_LAT || '42.23870'),
  lng: parseFloat(process.env.STORE_LNG || '-83.26968'),
};

// Store address for Shippo
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

// Default shipping estimate for display before Shippo rates
export const DEFAULT_SHIPPING_ESTIMATE_DAYS = {
  min: 2,
  max: 5,
};

// Whether to use Shippo labels for all fulfillment methods
// Set to true if you want shipping labels even for pickup/local delivery
export const USE_SHIPPO_LABELS_FOR_ALL_FULFILLMENT = false;

// Default parcel dimensions for shipping calculations (in inches and ounces)
export const DEFAULT_PARCEL = {
  length: 14,
  width: 10,
  height: 3,
  weight: 16, // 1 lb in ounces
};

// Fulfillment method types
export type FulfillmentMethod = 'pickup' | 'local_delivery' | 'shipping';

// Zone types based on distance
export type DeliveryZone = 'local' | 'shippo';

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

// Shipping rate from Shippo
export interface ShippingRate {
  id: string;
  carrier: string;
  carrierAccount: string;
  serviceLevelName: string;
  serviceLevelToken: string;
  amount: number; // in cents
  currency: string;
  estimatedDays: number | null;
  estimatedDeliveryDate: string | null;
  durationTerms: string | null;
}

// Cart item for shipping calculations
export interface ShippingCartItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  qty: number;
  weight?: number; // in ounces
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

// Order fulfillment data
export interface OrderFulfillment {
  method: FulfillmentMethod;
  locationZone: LocationZone;
  shippingRateId?: string; // Shippo rate ID for shipping orders
  shippingAmount?: number; // in cents
  localDeliveryFee?: number; // in cents
  // Shippo tracking info (populated after label creation)
  shippoShipmentId?: string;
  shippoTransactionId?: string;
  labelUrl?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  // Internal packing slip (for pickup/local)
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
  return `Delivering to ${location} · Shipping only (no local delivery)`;
}

