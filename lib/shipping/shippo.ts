/**
 * Shippo API Integration
 * Handles shipping rate retrieval and label creation
 */

import {
  STORE_ADDRESS,
  DEFAULT_PARCEL,
  ShippingRate,
  ShippingCartItem,
  LocationZone,
} from './config';

const SHIPPO_API_URL = 'https://api.goshippo.com';

/**
 * Allowed shipping services
 * Only these carrier/service combinations will be shown to customers
 */
const ALLOWED_SHIPPING_SERVICES = [
  { carrier: 'UPS', serviceToken: 'ups_ground_saver' },
  { carrier: 'UPS', serviceToken: 'ups_ground' },
  { carrier: 'USPS', serviceToken: 'usps_ground_advantage' },
];

/**
 * Check if a rate matches our allowed services
 */
function isAllowedService(rate: any): boolean {
  const carrier = rate.provider?.toUpperCase() || '';
  const serviceToken = rate.servicelevel?.token?.toLowerCase() || '';
  
  return ALLOWED_SHIPPING_SERVICES.some(
    allowed => 
      carrier.includes(allowed.carrier) && 
      serviceToken.includes(allowed.serviceToken.replace('ups_', '').replace('usps_', ''))
  );
}

/**
 * Get Shippo API token from environment
 */
function getShippoToken(): string {
  const token = process.env.SHIPPO_API_TOKEN;
  if (!token) {
    throw new Error('SHIPPO_API_TOKEN is not configured');
  }
  return token;
}

/**
 * Make authenticated request to Shippo API
 */
async function shippoRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getShippoToken();
  
  const response = await fetch(`${SHIPPO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `ShippoToken ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Shippo API error:', data);
    throw new Error(data.detail || data.message || 'Shippo API request failed');
  }

  return data;
}

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

  // Log all available rates for debugging
  console.log('📦 All available rates:', shipment.rates?.map((r: any) => ({
    carrier: r.provider,
    service: r.servicelevel?.token,
    name: r.servicelevel?.name,
    amount: r.amount,
  })));

  // Extract and format rates - filter for allowed services only
  const rates: ShippingRate[] = shipment.rates
    .filter((rate: any) => rate.amount) // Filter out rates without amounts
    .filter((rate: any) => {
      // Check if this rate matches our allowed services
      const carrier = rate.provider?.toUpperCase() || '';
      const serviceToken = rate.servicelevel?.token?.toLowerCase() || '';
      
      // UPS Ground Saver
      if (carrier === 'UPS' && serviceToken === 'ups_ground_saver') return true;
      // UPS Ground
      if (carrier === 'UPS' && serviceToken === 'ups_ground') return true;
      // USPS Ground Advantage
      if (carrier === 'USPS' && serviceToken === 'usps_ground_advantage') return true;
      
      return false;
    })
    .map((rate: any) => ({
      id: rate.object_id,
      carrier: rate.provider,
      carrierAccount: rate.carrier_account,
      serviceLevelName: rate.servicelevel?.name || rate.servicelevel_name || 'Standard',
      serviceLevelToken: rate.servicelevel?.token || '',
      amount: Math.round(parseFloat(rate.amount) * 100), // Convert to cents
      currency: rate.currency?.toUpperCase() || 'USD',
      estimatedDays: rate.estimated_days || null,
      estimatedDeliveryDate: rate.duration_terms || null,
      durationTerms: rate.duration_terms || null,
    }))
    .sort((a: ShippingRate, b: ShippingRate) => a.amount - b.amount); // Sort by price

  console.log('📦 Filtered to', rates.length, 'allowed shipping rates:', rates.map(r => `${r.carrier} ${r.serviceLevelName}`));

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

