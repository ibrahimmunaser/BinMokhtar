/**
 * Inventory Management
 * Handles stock decrements when orders are placed
 */

import { adminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface OrderItemForInventory {
  productId: string;
  variantId?: string;
  size?: string;
  color?: string;
  qty: number;
  sku?: string;
}

/**
 * Decrement inventory for all items in an order
 * This should be called after an order is created/paid
 */
export async function decrementInventoryForOrder(
  items: OrderItemForInventory[]
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  console.log(`📦 Decrementing inventory for ${items.length} items`);
  
  for (const item of items) {
    try {
      await decrementInventoryForItem(item);
      console.log(`✅ Inventory decremented for item: ${item.sku || item.productId}`);
    } catch (error: any) {
      const errorMsg = `Failed to update stock for product ${item.productId}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      // Continue processing other items even if one fails
    }
  }
  
  const success = errors.length === 0;
  if (success) {
    console.log(`✅ Successfully decremented inventory for all ${items.length} items`);
  } else {
    console.warn(`⚠️ Completed with ${errors.length} error(s) out of ${items.length} items`);
  }
  
  return { success, errors };
}

/**
 * Decrement inventory for a single item
 */
async function decrementInventoryForItem(item: OrderItemForInventory): Promise<void> {
  const db = adminDb();
  const productRef = db.collection('products').doc(item.productId);
  const productSnap = await productRef.get();
  
  if (!productSnap.exists) {
    throw new Error(`Product ${item.productId} not found`);
  }
  
  const productData = productSnap.data();
  
  // Try to decrement variant stock first (per size/color combination)
  let variantUpdated = false;
  if (item.size || item.color) {
    try {
      // Find and update the specific variant
      const variantsCol = productRef.collection('variants');
      const variantsSnapshot = await variantsCol.get();
      
      for (const variantDoc of variantsSnapshot.docs) {
        const variantData = variantDoc.data();
        const sizeMatch = !item.size || variantData.size === item.size;
        const colorMatch = !item.color || variantData.color === item.color;
        
        if (sizeMatch && colorMatch) {
          const currentVariantStock = variantData.stock || 0;
          const newVariantStock = Math.max(0, currentVariantStock - item.qty);
          
          await variantDoc.ref.update({
            stock: newVariantStock,
            updatedAt: Timestamp.now(),
          });
          
          variantUpdated = true;
          console.log(`  └─ Updated variant stock: ${item.productId}/${variantDoc.id} - ${currentVariantStock} → ${newVariantStock}`);
          break; // Found and updated the variant
        }
      }
    } catch (variantError: any) {
      console.warn(`  └─ Failed to update variant stock for ${item.productId}:`, variantError.message);
    }
  }
  
  // Also update the product-level totalStock in counts
  const currentCounts = productData?.counts || { totalStock: 0 };
  const currentTotalStock = currentCounts.totalStock || productData?.stock || 0;
  const newTotalStock = Math.max(0, currentTotalStock - item.qty);
  
  await productRef.update({
    'counts.totalStock': newTotalStock,
    stock: newTotalStock, // Also update legacy field
    updatedAt: Timestamp.now(),
  });
  
  console.log(`  └─ Updated product totalStock: ${item.productId} - ${currentTotalStock} → ${newTotalStock}`);
}

/**
 * Check if items are in stock before order creation
 * Returns validation result with errors if any items are out of stock
 */
export async function validateInventoryForOrder(
  items: OrderItemForInventory[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  for (const item of items) {
    try {
      const db = adminDb();
      const productDoc = await db.collection('products').doc(item.productId).get();
      
      if (!productDoc.exists) {
        errors.push(`Product "${item.sku || item.productId}" is no longer available`);
        continue;
      }
      
      const productData = productDoc.data();
      
      // Check variant-level stock if size/color specified
      if (item.size || item.color) {
        const variantsSnap = await db
          .collection('products')
          .doc(item.productId)
          .collection('variants')
          .get();
        
        let variantFound = false;
        for (const variantDoc of variantsSnap.docs) {
          const variantData = variantDoc.data();
          const sizeMatch = !item.size || variantData.size === item.size;
          const colorMatch = !item.color || variantData.color === item.color;
          
          if (sizeMatch && colorMatch) {
            variantFound = true;
            const availableStock = variantData.stock || 0;
            
            if (availableStock < item.qty) {
              const variantDesc = [item.size, item.color].filter(Boolean).join(' / ');
              if (availableStock === 0) {
                errors.push(`"${item.sku || item.productId}" (${variantDesc}) is out of stock`);
              } else {
                errors.push(`"${item.sku || item.productId}" (${variantDesc}) only has ${availableStock} available (you requested ${item.qty})`);
              }
            }
            break;
          }
        }
        
        if (!variantFound) {
          const variantDesc = [item.size, item.color].filter(Boolean).join(' / ');
          errors.push(`"${item.sku || item.productId}" (${variantDesc}) is no longer available`);
        }
      } else {
        // Check product-level stock
        const totalStock = productData?.counts?.totalStock || productData?.stock || 0;
        
        if (totalStock < item.qty) {
          if (totalStock === 0) {
            errors.push(`"${item.sku || item.productId}" is out of stock`);
          } else {
            errors.push(`"${item.sku || item.productId}" only has ${totalStock} available (you requested ${item.qty})`);
          }
        }
      }
    } catch (error: any) {
      console.error(`Error validating stock for product ${item.productId}:`, error);
      errors.push(`Unable to verify stock for "${item.sku || item.productId}"`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

