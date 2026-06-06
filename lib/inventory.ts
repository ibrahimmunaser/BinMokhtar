/**
 * Inventory Management
 * Handles stock validation and decrements when orders are placed.
 *
 * All writes use Firestore transactions to prevent race conditions / oversell.
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
 * Normalise a size value so that numeric sizes stored as different types
 * ("56" vs 56) still match correctly.
 */
function normaliseSize(value: string | number | undefined | null): string {
  return value == null ? '' : String(value).trim();
}

/** Thrown inside the transaction when the requested qty exceeds available stock. */
export class InsufficientStockError extends Error {
  constructor(
    public readonly productId: string,
    public readonly available: number,
    public readonly requested: number,
    public readonly descriptor: string
  ) {
    super(
      `Insufficient stock for "${descriptor}": requested ${requested}, available ${available}`
    );
    this.name = 'InsufficientStockError';
  }
}

/**
 * Decrement inventory for all items in a paid order.
 * Continues processing even if individual items fail, collecting errors.
 * Returns oversold items separately so callers can flag the order.
 */
export async function decrementInventoryForOrder(items: OrderItemForInventory[]): Promise<{
  success: boolean;
  errors: string[];
  oversoldItems: string[];
}> {
  const errors: string[] = [];
  const oversoldItems: string[] = [];

  for (const item of items) {
    try {
      await decrementInventoryForItem(item);
    } catch (error: any) {
      if (error instanceof InsufficientStockError) {
        // Payment already captured — log the oversell, flag the order, do NOT re-throw
        const msg = error.message;
        console.error(`🚨 OVERSELL DETECTED: ${msg}`);
        oversoldItems.push(msg);
        errors.push(msg);
      } else {
        const msg = `Failed to update stock for product ${item.productId}: ${error.message}`;
        console.error(`❌ ${msg}`);
        errors.push(msg);
      }
    }
  }

  if (errors.length === 0) {
    console.log(`✅ Inventory decremented for all ${items.length} items`);
  } else {
    console.warn(`⚠️ Inventory decrement finished with ${errors.length} error(s)`);
  }

  return { success: errors.length === 0, errors, oversoldItems };
}

/**
 * Decrement inventory for a single order item using a Firestore transaction
 * to prevent oversell under concurrent orders.
 *
 * Throws InsufficientStockError if the available stock is less than qty requested.
 *
 * Steps:
 *  1. Outside transaction: find the matching variant doc ID (by size/color + String coercion)
 *  2. Inside transaction: atomically read → validate (throw if insufficient) → write
 */
async function decrementInventoryForItem(item: OrderItemForInventory): Promise<void> {
  const db = adminDb();
  const productRef = db.collection('products').doc(item.productId);
  const descriptor = item.sku || item.productId;

  // ── Phase 1: locate variant doc ID outside transaction ────────────────────
  // Using variantId directly if provided (most reliable), otherwise match by size/color.
  let variantDocId: string | null = item.variantId ?? null;

  if (!variantDocId && (item.size || item.color)) {
    const variantsSnap = await productRef.collection('variants').get();
    for (const doc of variantsSnap.docs) {
      const d = doc.data();
      const sizeMatch = !item.size || normaliseSize(d.size) === normaliseSize(item.size);
      const colorMatch = !item.color || normaliseSize(d.color) === normaliseSize(item.color);
      if (sizeMatch && colorMatch) {
        variantDocId = doc.id;
        break;
      }
    }
  }

  // ── Phase 2: atomic read → validate → write ──────────────────────────────
  await db.runTransaction(async (tx) => {
    const productSnap = await tx.get(productRef);
    if (!productSnap.exists) {
      throw new Error(`Product ${item.productId} not found`);
    }
    const productData = productSnap.data()!;

    const variantRef = variantDocId
      ? productRef.collection('variants').doc(variantDocId)
      : null;
    const variantSnap = variantRef ? await tx.get(variantRef) : null;

    // ── Variant path ──────────────────────────────────────────────────────
    let variantWentToZero = false;
    let variantUpdated = false;

    if (variantRef && variantSnap?.exists) {
      const variantData = variantSnap.data()!;
      const currentVariantStock: number = variantData.stock ?? 0;

      // HARD STOP: refuse to allow oversell inside the atomic transaction
      if (currentVariantStock < item.qty) {
        throw new InsufficientStockError(
          item.productId,
          currentVariantStock,
          item.qty,
          descriptor
        );
      }

      const newVariantStock = currentVariantStock - item.qty;
      variantWentToZero = currentVariantStock > 0 && newVariantStock === 0;
      variantUpdated = true;

      tx.update(variantRef, {
        stock: newVariantStock,
        active: newVariantStock > 0,
        updatedAt: Timestamp.now(),
      });

      console.log(`  └─ variant ${variantDocId}: ${currentVariantStock} → ${newVariantStock}`);
    } else if (item.size || item.color) {
      // Variant was specified but not found in DB — do NOT touch the product aggregate
      // (we have no idea which bucket to decrement).
      console.warn(
        `  └─ variant not found for ${descriptor} size="${item.size}" color="${item.color}" — skipping aggregate decrement`
      );
      return; // exit transaction without writing anything
    }

    // ── Product-level aggregate — only update if variant was found or no variants ──
    const counts = productData.counts ?? {};
    const currentTotal: number = counts.totalStock ?? productData.stock ?? 0;

    // If a variant was specified but not found we already returned above.
    // If no variant is specified this is a simple product — validate its stock too.
    if (!variantUpdated && !item.size && !item.color) {
      if (currentTotal < item.qty) {
        throw new InsufficientStockError(item.productId, currentTotal, item.qty, descriptor);
      }
    }

    const newTotal = Math.max(0, currentTotal - item.qty);
    const currentActive: number = counts.activeVariants ?? 0;
    const newActive = variantWentToZero ? Math.max(0, currentActive - 1) : currentActive;

    tx.update(productRef, {
      'counts.totalStock': newTotal,
      'counts.activeVariants': newActive,
      stock: newTotal,
      updatedAt: Timestamp.now(),
    });

    console.log(`  └─ product ${item.productId} totalStock: ${currentTotal} → ${newTotal}`);
  });
}

/**
 * Validate that all items in a prospective order are in stock.
 * Fails closed: any Firestore error is treated as "unavailable".
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
        errors.push(`"${item.sku || item.productId}" is no longer available`);
        continue;
      }

      const productData = productDoc.data()!;

      if (item.size || item.color) {
        const variantsSnap = await db
          .collection('products')
          .doc(item.productId)
          .collection('variants')
          .get();

        let found = false;
        for (const variantDoc of variantsSnap.docs) {
          const d = variantDoc.data();
          const sizeMatch = !item.size || normaliseSize(d.size) === normaliseSize(item.size);
          const colorMatch =
            !item.color || normaliseSize(d.color) === normaliseSize(item.color);

          if (sizeMatch && colorMatch) {
            found = true;
            const avail: number = d.stock ?? 0;
            const desc = [item.size, item.color].filter(Boolean).join(' / ');
            if (avail === 0) {
              errors.push(`"${item.sku || item.productId}" (${desc}) is out of stock`);
            } else if (avail < item.qty) {
              errors.push(
                `"${item.sku || item.productId}" (${desc}) only has ${avail} available (requested ${item.qty})`
              );
            }
            break;
          }
        }

        if (!found) {
          const desc = [item.size, item.color].filter(Boolean).join(' / ');
          errors.push(`"${item.sku || item.productId}" (${desc}) variant no longer exists`);
        }
      } else {
        const total: number =
          productData.counts?.totalStock ?? productData.stock ?? 0;
        if (total === 0) {
          errors.push(`"${item.sku || item.productId}" is out of stock`);
        } else if (total < item.qty) {
          errors.push(
            `"${item.sku || item.productId}" only has ${total} available (requested ${item.qty})`
          );
        }
      }
    } catch (err: any) {
      // Fail closed: treat DB errors as unavailable to prevent oversell
      console.error(`Error validating stock for ${item.productId}:`, err);
      errors.push(
        `Unable to verify stock for "${item.sku || item.productId}". Please try again.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
