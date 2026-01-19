/**
 * Shippo API Integration
 * Handles shipping rate retrieval and label creation
 * 
 * NOTE: For post-payment label creation, use lib/shipping/shippoOrderLabel.ts
 * This file is kept for backward compatibility with checkout flow.
 */

import {
  STORE_ADDRESS,
  DEFAULT_PARCEL,
  ShippingRate,
  ShippingCartItem,
  LocationZone,
} from './config';
import { shippoRequest } from './shippoApi';

/**
 * Allowed shipping service levels
 * Only these services will be shown to customers
 */
const ALLOWED_SERVICE_LEVELS = [
  // USPS
  'usps_priority',           // USPS Priority Mail
  'usps_ground_advantage',   // USPS Ground Advantage
  // UPS
  'ups_ground',              // UPS Ground
  'ups_3_day_select',        // UPS 3 Day Select
];

/**
 * Calculate parcel dimensions from cart items
 * For now, uses default parcel - can be enhanced to calculate based on items
 */
function calculateParcel(items: ShippingCartItem[]): {
  length: number;
  width: number;
  height: number;
  weight: number;
  mass_unit: string;
  distance_unit: string;
} {
  // Sum up weights from items, or use default
  let totalWeight = 0;
  
  for (const item of items) {
    const itemWeight = item.weight || DEFAULT_PARCEL.weight;
    totalWeight += itemWeight * item.qty;
  }

  // Use default dimensions (could be enhanced based on item count)
  return {
    length: DEFAULT_PARCEL.length,
    width: DEFAULT_PARCEL.width,
    height: DEFAULT_PARCEL.height,
    weight: totalWeight || DEFAULT_PARCEL.weight,
    mass_unit: 'oz',
    distance_unit: 'in',
  };
}

/**
 * Create a Shippo shipment and get available rates
 */
export async function getShippingRates(
  destination: LocationZone,
  items: ShippingCartItem[]
): Promise<ShippingRate[]> {
  console.log('📦 Getting shipping rates for:', destination.formattedAddress);

  // Build address objects
  const addressFrom = {
    name: STORE_ADDRESS.name,
    street1: STORE_ADDRESS.street1,
    city: STORE_ADDRESS.city,
    state: STORE_ADDRESS.state,
    zip: STORE_ADDRESS.zip,
    country: STORE_ADDRESS.country,
    phone: STORE_ADDRESS.phone || undefined,
    email: STORE_ADDRESS.email || undefined,
  };

  const addressTo = {
    name: 'Customer', // Will be updated with actual name at checkout
    street1: destination.street || destination.formattedAddress,
    city: destination.city,
    state: destination.state,
    zip: destination.zip,
    country: destination.country || 'US',
  };

  // Calculate parcel
  const parcel = calculateParcel(items);

  // Create shipment
  const shipmentData = {
    address_from: addressFrom,
    address_to: addressTo,
    parcels: [parcel],
    async: false, // Get rates synchronously
  };

  console.log('📦 Creating Shippo shipment:', shipmentData);

  const shipment = await shippoRequest('/shipments', {
    method: 'POST',
    body: JSON.stringify(shipmentData),
  });

  console.log('📦 Shipment created:', shipment.object_id);

  // Extract and format rates, filtering to only allowed services
  const rates: ShippingRate[] = shipment.rates
    .filter((rate: any) => {
      // Must have an amount
      if (!rate.amount) {
        console.warn('⚠️ Rate has no amount:', rate.servicelevel?.name);
        return false;
      }
      
      // Amount must be valid
      const parsedAmount = parseFloat(rate.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.warn('⚠️ Rate has invalid amount:', rate.servicelevel?.name, rate.amount);
        return false;
      }
      
      // Must be in our allowed service levels
      const serviceToken = rate.servicelevel?.token || '';
      if (!ALLOWED_SERVICE_LEVELS.includes(serviceToken)) {
        return false;
      }
      
      return true;
    })
    .map((rate: any) => {
      const amountInCents = Math.round(parseFloat(rate.amount) * 100);
      
      console.log('✅ Shipping rate:', {
        service: rate.servicelevel?.name,
        amount: rate.amount,
        amountInCents,
        carrier: rate.provider,
      });
      
      return {
        id: rate.object_id,
        carrier: rate.provider,
        carrierAccount: rate.carrier_account,
        serviceLevelName: rate.servicelevel?.name || rate.servicelevel_name || 'Standard',
        serviceLevelToken: rate.servicelevel?.token || '',
        amount: amountInCents, // In cents
        currency: rate.currency?.toUpperCase() || 'USD',
        estimatedDays: rate.estimated_days || null,
        estimatedDeliveryDate: rate.duration_terms || null,
        durationTerms: rate.duration_terms || null,
      };
    })
    .filter((rate: ShippingRate) => {
      // Final validation: ensure amount is positive integer
      if (!Number.isInteger(rate.amount) || rate.amount <= 0) {
        console.error('❌ Rate has invalid final amount:', rate.serviceLevelName, rate.amount);
        return false;
      }
      return true;
    })
    .sort((a: ShippingRate, b: ShippingRate) => a.amount - b.amount); // Sort by price

  console.log('📦 Got', rates.length, 'shipping rates (filtered from', shipment.rates?.length || 0, 'total)');

  return rates;
}

/**
 * Create a shipping label from a rate
 */
export async function createShippingLabel(
  rateId: string
): Promise<{
  transactionId: string;
  labelUrl: string;
  trackingNumber: string;
  trackingUrl: string;
}> {
  console.log('📦 Creating shipping label for rate:', rateId);

  const transaction = await shippoRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      rate: rateId,
      label_file_type: 'PDF',
      async: false,
    }),
  });

  if (transaction.status !== 'SUCCESS') {
    console.error('Label creation failed:', transaction);
    throw new Error(
      transaction.messages?.[0]?.text || 'Failed to create shipping label'
    );
  }

  console.log('📦 Label created:', transaction.object_id);

  return {
    transactionId: transaction.object_id,
    labelUrl: transaction.label_url,
    trackingNumber: transaction.tracking_number,
    trackingUrl: transaction.tracking_url_provider,
  };
}

/**
 * Validate an address with Shippo
 */
export async function validateAddress(address: {
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}): Promise<{
  isValid: boolean;
  validatedAddress?: any;
  messages?: string[];
}> {
  try {
    const result = await shippoRequest('/addresses', {
      method: 'POST',
      body: JSON.stringify({
        ...address,
        validate: true,
      }),
    });

    return {
      isValid: result.validation_results?.is_valid || false,
      validatedAddress: result,
      messages: result.validation_results?.messages?.map((m: any) => m.text) || [],
    };
  } catch (error: any) {
    console.error('Address validation error:', error);
    return {
      isValid: false,
      messages: [error.message],
    };
  }
}

