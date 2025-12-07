/**
 * Shippo Order Label Creation
 * 
 * Creates a Shippo shipment, selects a rate, and purchases a label for an order.
 * This is the full flow: shipment -> rates -> select rate -> transaction (label).
 */

import { shippoRequest } from './shippoApi';
import { STORE_ADDRESS } from './config';
import { calculateOrderWeight } from './calculateOrderWeight';
import type { Order } from '@/types';

export interface ShippoLabelResult {
  success: boolean;
  shipmentId?: string;
  transactionId?: string;
  labelUrl?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  error?: string;
}

/**
 * Create Shippo label for an order
 * 
 * Steps:
 * 1. Build from/to addresses
 * 2. Calculate parcel weight
 * 3. Create shipment
 * 4. Select best rate
 * 5. Purchase label (transaction)
 */
export async function createShippoLabelForOrder(
  order: Order
): Promise<ShippoLabelResult> {
  console.log('📦 Creating Shippo label for order:', order.id);

  try {
    // Validate shipping address
    if (!order.shippingAddress) {
      throw new Error('Order missing shipping address');
    }

    const shipping = order.shippingAddress;
    
    // Validate required address fields
    if (!shipping.fullName || !shipping.address || !shipping.city || 
        !shipping.state || !shipping.zip || !shipping.country) {
      throw new Error('Shipping address missing required fields (name, address, city, state, zip, country)');
    }

    // Build "from" address (store)
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

    // Build "to" address (customer)
    const addressTo = {
      name: shipping.fullName,
      street1: shipping.address,
      street2: shipping.address2 || undefined,
      city: shipping.city,
      state: shipping.state,
      zip: shipping.zip,
      country: shipping.country,
      phone: shipping.phone || undefined,
      email: shipping.email || shipping.email || undefined,
    };

    // Calculate order weight
    const totalWeightGrams = await calculateOrderWeight(order);
    
    if (totalWeightGrams <= 0) {
      throw new Error(`Invalid order weight: ${totalWeightGrams}g`);
    }

    // Convert grams to ounces for Shippo (Shippo uses oz)
    const weightOz = totalWeightGrams / 28.35; // 1 oz = 28.35g

    // Build parcel (use default dimensions, weight from order)
    // Default dimensions for a typical thobe box
    const parcel = {
      length: 14, // inches
      width: 10, // inches
      height: 3, // inches
      weight: Math.max(1, Math.round(weightOz * 100) / 100), // Round to 2 decimals, min 1 oz
      mass_unit: 'oz',
      distance_unit: 'in',
    };

    console.log('📦 Parcel:', parcel);

    // Step 1: Create shipment
    // Note: Omitting metadata field as it's optional and can cause API errors
    // Order tracking is handled via shipment.object_id which we store in the order
    const shipmentData = {
      address_from: addressFrom,
      address_to: addressTo,
      parcels: [parcel],
      async: false, // Get rates synchronously
    };

    console.log('📦 Creating Shippo shipment...');
    const shipment = await shippoRequest('/shipments', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });

    if (!shipment.object_id) {
      throw new Error('Shippo shipment creation failed: no object_id returned');
    }

    console.log('✅ Shipment created:', shipment.object_id);

    // Step 2: Select best rate
    if (!shipment.rates || shipment.rates.length === 0) {
      throw new Error('No shipping rates available for this address');
    }

    // Filter valid rates (must have amount and be domestic USPS/UPS)
    const validRates = shipment.rates.filter((rate: any) => {
      if (!rate.amount) return false;
      
      // Prefer domestic services
      const provider = rate.provider?.toLowerCase() || '';
      const serviceToken = rate.servicelevel?.token || '';
      
      // Allow USPS and UPS services
      return (provider === 'usps' || provider === 'ups') && 
             serviceToken.includes('ground') || 
             serviceToken.includes('priority') ||
             serviceToken.includes('advantage');
    });

    if (validRates.length === 0) {
      // Fallback to first rate if no preferred rates found
      console.warn('⚠️ No preferred rates found, using first available rate');
      const firstRate = shipment.rates[0];
      if (!firstRate || !firstRate.object_id) {
        throw new Error('No valid shipping rates available');
      }
      
      const selectedRateId = firstRate.object_id;
      console.log('📦 Selected rate (fallback):', selectedRateId);

      // Step 3: Purchase label
      return await purchaseLabel(selectedRateId, shipment.object_id);
    }

    // Sort by price (cheapest first) and select
    validRates.sort((a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount));
    const selectedRate = validRates[0];
    const selectedRateId = selectedRate.object_id;

    console.log('📦 Selected rate:', selectedRateId, 
      `(${selectedRate.provider} ${selectedRate.servicelevel?.name || 'Standard'})`);

    // Step 3: Purchase label (create transaction)
    return await purchaseLabel(selectedRateId, shipment.object_id);

  } catch (error: any) {
    console.error('❌ Error creating Shippo label:', error);
    return {
      success: false,
      error: error.message || 'Failed to create Shippo label',
    };
  }
}

/**
 * Purchase a Shippo label (create transaction)
 */
async function purchaseLabel(
  rateId: string,
  shipmentId: string
): Promise<ShippoLabelResult> {
  console.log('📦 Purchasing label for rate:', rateId);

  try {
    const transaction = await shippoRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        rate: rateId,
        label_file_type: 'PDF',
        async: false,
      }),
    });

    if (transaction.status !== 'SUCCESS') {
      const errorMsg = transaction.messages?.[0]?.text || 
                      transaction.messages?.[0]?.source || 
                      'Transaction failed';
      throw new Error(`Shippo transaction failed: ${errorMsg}`);
    }

    console.log('✅ Label purchased:', transaction.object_id);
    console.log('📦 Transaction object keys:', Object.keys(transaction));
    console.log('📦 Transaction label fields:', {
      label_url: transaction.label_url,
      labelURL: transaction.labelURL,
      label_file_url: transaction.label_file_url,
      commercial_invoice_url: transaction.commercial_invoice_url,
      tracking_number: transaction.tracking_number,
      status: transaction.status,
    });

    // Check multiple possible field names for label URL
    const labelUrl = transaction.label_url || 
                     transaction.labelURL || 
                     transaction.label_file_url ||
                     transaction.commercial_invoice_url ||
                     null;

    // If label URL is missing, try fetching the transaction again
    // Sometimes Shippo needs a moment to generate the label
    if (!labelUrl && transaction.object_id) {
      console.log('⚠️ Label URL not in initial response, fetching transaction details...');
      console.log('📦 Full transaction object:', JSON.stringify(transaction, null, 2));
      
      // Try multiple times with increasing delays
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const waitTime = attempt * 2000; // 2s, 4s, 6s
          console.log(`⏳ Waiting ${waitTime}ms before fetch attempt ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          const fetchedTransaction = await shippoRequest(`/transactions/${transaction.object_id}`, {
            method: 'GET',
          });
          
          console.log(`📦 Fetched transaction (attempt ${attempt}) label fields:`, {
            label_url: fetchedTransaction.label_url,
            labelURL: fetchedTransaction.labelURL,
            label_file_url: fetchedTransaction.label_file_url,
            commercial_invoice_url: fetchedTransaction.commercial_invoice_url,
            status: fetchedTransaction.status,
            object_id: fetchedTransaction.object_id,
            allKeys: Object.keys(fetchedTransaction).filter(k => k.toLowerCase().includes('label') || k.toLowerCase().includes('url')),
          });
          
          // Check all possible field names
          const fetchedLabelUrl = fetchedTransaction.label_url || 
                                   fetchedTransaction.labelURL || 
                                   fetchedTransaction.label_file_url ||
                                   fetchedTransaction.commercial_invoice_url ||
                                   fetchedTransaction.label ||
                                   fetchedTransaction.label_pdf ||
                                   fetchedTransaction.pdf_url ||
                                   null;
          
          if (fetchedLabelUrl) {
            console.log('✅ Found label URL after fetch:', fetchedLabelUrl);
            return {
              success: true,
              shipmentId,
              transactionId: transaction.object_id,
              labelUrl: fetchedLabelUrl,
              trackingNumber: transaction.tracking_number || fetchedTransaction.tracking_number,
              trackingUrl: transaction.tracking_url_provider || fetchedTransaction.tracking_url_provider,
            };
          }
          
          // If status is still SUCCESS but no label URL, log full transaction for debugging
          if (fetchedTransaction.status === 'SUCCESS' && !fetchedLabelUrl) {
            console.warn(`⚠️ Attempt ${attempt}: Transaction is SUCCESS but no label URL found`);
            console.warn('⚠️ Full fetched transaction:', JSON.stringify(fetchedTransaction, null, 2));
          }
        } catch (fetchError: any) {
          console.error(`❌ Error fetching transaction details (attempt ${attempt}):`, fetchError);
        }
      }
    }

    if (!labelUrl) {
      console.warn('⚠️ WARNING: Transaction successful but no label URL found after retry!');
      console.warn('⚠️ Transaction object:', JSON.stringify(transaction, null, 2));
      
      // WORKAROUND: Try to construct the Shippo label URL from transaction ID
      // Shippo label URLs follow a pattern - try to use it
      if (transaction.object_id) {
        const constructedUrl = `https://deliver.goshippo.com/v1/labels/${transaction.object_id}.pdf`;
        console.log('📦 Trying constructed label URL:', constructedUrl);
        
        // Verify the URL works by making a HEAD request
        try {
          const checkResponse = await fetch(constructedUrl, { method: 'HEAD' });
          if (checkResponse.ok) {
            console.log('✅ Constructed label URL is valid!');
            return {
              success: true,
              shipmentId,
              transactionId: transaction.object_id,
              labelUrl: constructedUrl,
              trackingNumber: transaction.tracking_number,
              trackingUrl: transaction.tracking_url_provider,
            };
          } else {
            console.warn('❌ Constructed label URL returned status:', checkResponse.status);
          }
        } catch (urlError) {
          console.warn('❌ Error checking constructed URL:', urlError);
        }
      }
    }

    return {
      success: true,
      shipmentId,
      transactionId: transaction.object_id,
      labelUrl: labelUrl,
      trackingNumber: transaction.tracking_number,
      trackingUrl: transaction.tracking_url_provider,
    };
  } catch (error: any) {
    console.error('❌ Error purchasing label:', error);
    return {
      success: false,
      shipmentId,
      error: error.message || 'Failed to purchase label',
    };
  }
}

