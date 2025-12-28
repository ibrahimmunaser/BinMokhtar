/**
 * Create Shipping Artifacts for Order
 * 
 * This function is called after payment success to:
 * - For shipping orders: Create Shippo shipment, select rate, purchase label
 * - For pickup/local_delivery orders: Generate internal label
 * 
 * IMPORTANT: This function is idempotent - it will not create duplicate labels
 * if one already exists for the order.
 */

import { adminDb } from '@/lib/firebase/server';
import { createShippoLabelForOrder } from './shippoOrderLabel';
import { createInternalLabelForOrder } from './internalLabel';
import type { Order } from '@/types';

export interface CreateShippingArtifactsResult {
  success: boolean;
  labelCreated: boolean;
  labelUrl?: string;
  trackingNumber?: string;
  internalLabelUrl?: string;
  error?: string;
}

/**
 * Create shipping artifacts for an order after payment success
 * 
 * @param orderId - The Firestore order document ID
 * @returns Result indicating success/failure and label URLs
 */
export async function createShippingArtifactsForOrder(
  orderId: string
): Promise<CreateShippingArtifactsResult> {
  console.log('📦 Creating shipping artifacts for order:', orderId);

  try {
    const db = adminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = { id: orderDoc.id, ...orderDoc.data() } as Order;

    // IDEMPOTENCY CHECK: If label already exists, return early
    if (order.shippo_label_url || order.internal_label_url) {
      console.log('✅ Label already exists for order:', orderId);
      return {
        success: true,
        labelCreated: false,
        labelUrl: order.shippo_label_url || undefined,
        trackingNumber: order.shippo_tracking_number || undefined,
        internalLabelUrl: order.internal_label_url || undefined,
      };
    }

    // Determine fulfillment method
    const fulfillmentMethod = order.fulfillmentMethod || 
      (order as any).fulfillment?.method || 
      'shipping'; // Default to shipping for backward compatibility

    console.log('📦 Fulfillment method:', fulfillmentMethod);

    // Case 1: Shipping - Create Shippo label
    if (fulfillmentMethod === 'shipping') {
      try {
        // Mark as pending
        await orderRef.update({
          shippo_label_status: 'pending',
          updatedAt: new Date(),
        });

        const shippoResult = await createShippoLabelForOrder(order);

        // Update order with Shippo label info
        await orderRef.update({
          shippo_shipment_id: shippoResult.shipmentId || null,
          shippo_transaction_id: shippoResult.transactionId || null,
          shippo_label_url: shippoResult.labelUrl || null,
          shippo_tracking_number: shippoResult.trackingNumber || null,
          shippo_label_status: shippoResult.success ? 'success' : 'failed',
          shippo_error_message: shippoResult.error || null,
          // Legacy fields for backward compatibility
          labelUrl: shippoResult.labelUrl || null,
          trackingNumber: shippoResult.trackingNumber || null,
          trackingUrl: shippoResult.trackingUrl || null,
          shippoTransactionId: shippoResult.transactionId || null,
          updatedAt: new Date(),
        });

        if (shippoResult.success) {
          console.log('✅ Shippo label created successfully:', shippoResult.trackingNumber);
          return {
            success: true,
            labelCreated: true,
            labelUrl: shippoResult.labelUrl,
            trackingNumber: shippoResult.trackingNumber,
          };
        } else {
          console.error('❌ Shippo label creation failed:', shippoResult.error);
          return {
            success: false,
            labelCreated: false,
            error: shippoResult.error,
          };
        }
      } catch (error: any) {
        console.error('❌ Error creating Shippo label:', error);
        
        // Mark as failed
        await orderRef.update({
          shippo_label_status: 'failed',
          shippo_error_message: error.message || 'Unknown error creating Shippo label',
          updatedAt: new Date(),
        });

        return {
          success: false,
          labelCreated: false,
          error: error.message || 'Failed to create Shippo label',
        };
      }
    }

    // Case 2: Pickup or Local Delivery - Create internal label
    if (fulfillmentMethod === 'pickup' || fulfillmentMethod === 'local_delivery') {
      try {
        const internalLabelUrl = await createInternalLabelForOrder(order);

        // Update order with internal label URL
        await orderRef.update({
          internal_label_url: internalLabelUrl,
          // Legacy field for backward compatibility
          packingSlipUrl: internalLabelUrl,
          updatedAt: new Date(),
        });

        console.log('✅ Internal label created:', internalLabelUrl);
        return {
          success: true,
          labelCreated: true,
          internalLabelUrl,
        };
      } catch (error: any) {
        console.error('❌ Error creating internal label:', error);
        return {
          success: false,
          labelCreated: false,
          error: error.message || 'Failed to create internal label',
        };
      }
    }

    // Unknown fulfillment method
    console.warn('⚠️ Unknown fulfillment method:', fulfillmentMethod);
    return {
      success: false,
      labelCreated: false,
      error: `Unknown fulfillment method: ${fulfillmentMethod}`,
    };

  } catch (error: any) {
    console.error('❌ Error in createShippingArtifactsForOrder:', error);
    return {
      success: false,
      labelCreated: false,
      error: error.message || 'Unknown error',
    };
  }
}















