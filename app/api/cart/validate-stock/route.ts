import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';

interface CartItem {
  productId: string;
  variantId?: string;
  title?: string;
  name?: string;
  size?: string;
  color?: string;
  qty: number;
}

interface StockValidationResult {
  productId: string;
  variantId?: string;
  title: string;
  size?: string;
  color?: string;
  requestedQty: number;
  availableStock: number;
  isAvailable: boolean;
  message?: string;
}

/**
 * POST /api/cart/validate-stock
 * Validates stock for cart items in real-time
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: CartItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    const results: StockValidationResult[] = [];
    let hasOutOfStockItems = false;

    for (const item of items) {
      const title = item.title || item.name || 'Product';
      
      try {
        const productDoc = await adminDb().collection('products').doc(item.productId).get();
        
        if (!productDoc.exists) {
          results.push({
            productId: item.productId,
            variantId: item.variantId,
            title,
            size: item.size,
            color: item.color,
            requestedQty: item.qty,
            availableStock: 0,
            isAvailable: false,
            message: 'This product is no longer available',
          });
          hasOutOfStockItems = true;
          continue;
        }
        
        const productData = productDoc.data();
        
        // Check variant-level stock if size/color specified
        if (item.size || item.color) {
          const variantsSnap = await adminDb()
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
              const isAvailable = availableStock >= item.qty;
              
              let message: string | undefined;
              if (availableStock === 0) {
                message = 'Out of stock';
                hasOutOfStockItems = true;
              } else if (availableStock < item.qty) {
                message = `Only ${availableStock} available`;
                hasOutOfStockItems = true;
              }
              
              results.push({
                productId: item.productId,
                variantId: variantDoc.id,
                title,
                size: item.size,
                color: item.color,
                requestedQty: item.qty,
                availableStock,
                isAvailable,
                message,
              });
              break;
            }
          }
          
          if (!variantFound) {
            results.push({
              productId: item.productId,
              variantId: item.variantId,
              title,
              size: item.size,
              color: item.color,
              requestedQty: item.qty,
              availableStock: 0,
              isAvailable: false,
              message: 'This variant is no longer available',
            });
            hasOutOfStockItems = true;
          }
        } else {
          // Check product-level stock
          const totalStock = productData?.counts?.totalStock || productData?.stock || 0;
          const isAvailable = totalStock >= item.qty;
          
          let message: string | undefined;
          if (totalStock === 0) {
            message = 'Out of stock';
            hasOutOfStockItems = true;
          } else if (totalStock < item.qty) {
            message = `Only ${totalStock} available`;
            hasOutOfStockItems = true;
          }
          
          results.push({
            productId: item.productId,
            title,
            requestedQty: item.qty,
            availableStock: totalStock,
            isAvailable,
            message,
          });
        }
      } catch (error) {
        console.error(`Error validating stock for ${item.productId}:`, error);
        // Assume available to not block checkout due to temporary errors
        results.push({
          productId: item.productId,
          variantId: item.variantId,
          title,
          size: item.size,
          color: item.color,
          requestedQty: item.qty,
          availableStock: item.qty, // Assume available
          isAvailable: true,
          message: undefined,
        });
      }
    }

    return NextResponse.json({
      valid: !hasOutOfStockItems,
      results,
      hasOutOfStockItems,
    });

  } catch (error: any) {
    console.error('Stock validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate stock', message: error.message },
      { status: 500 }
    );
  }
}

