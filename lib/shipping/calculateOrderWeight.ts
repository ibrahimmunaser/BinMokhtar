/**
 * Calculate Order Weight
 * 
 * Calculates the total weight of an order in grams by summing up
 * product/variant weights. Falls back to default weight if missing.
 */

import { adminDb } from '@/lib/firebase/server';
import type { Order } from '@/types';

const DEFAULT_WEIGHT_GRAMS = 500; // 500g default (about 1.1 lbs for a thobe)

/**
 * Calculate total weight for an order in grams
 * Falls back to default weight if product/variant weights are missing
 */
export async function calculateOrderWeight(order: Order): Promise<number> {
  let totalWeightGrams = 0;
  const db = adminDb();

  for (const item of order.items) {
    let itemWeightGrams: number | undefined;

    try {
      // Try to get weight from variant first
      if (item.variantId) {
        const variantDoc = await db.collection('products')
          .doc(item.productId)
          .collection('variants')
          .doc(item.variantId)
          .get();
        
        if (variantDoc.exists) {
          const variantData = variantDoc.data();
          itemWeightGrams = variantData?.weight_grams;
        }
      }

      // Fallback to product weight
      if (!itemWeightGrams && item.productId) {
        const productDoc = await db.collection('products').doc(item.productId).get();
        if (productDoc.exists) {
          const productData = productDoc.data();
          itemWeightGrams = productData?.weight_grams;
        }
      }

      // Use default if still not found
      if (!itemWeightGrams) {
        console.warn(`⚠️ No weight found for product ${item.productId}, using default ${DEFAULT_WEIGHT_GRAMS}g`);
        itemWeightGrams = DEFAULT_WEIGHT_GRAMS;
      }

      totalWeightGrams += itemWeightGrams * item.qty;
    } catch (error) {
      console.error(`Error fetching weight for item ${item.id}:`, error);
      // Use default weight on error
      totalWeightGrams += DEFAULT_WEIGHT_GRAMS * item.qty;
    }
  }

  // Ensure minimum weight
  if (totalWeightGrams === 0) {
    console.warn('⚠️ Total weight is 0, using default weight');
    totalWeightGrams = DEFAULT_WEIGHT_GRAMS;
  }

  return totalWeightGrams;
}





