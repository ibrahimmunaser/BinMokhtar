import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/stress-test-orders
 * Creates 10 test orders and verifies they all have timestamps
 */
export async function POST(request: NextRequest) {
  console.log('🧪 ===== STRESS TEST: Creating 10 orders =====');
  
  const results: any[] = [];
  const db = adminDb();
  
  try {
    // Create 10 test orders
    for (let i = 1; i <= 10; i++) {
      console.log(`🧪 Creating test order ${i}/10...`);
      const now = Timestamp.now();
      
      const testOrder = {
        orderNumber: `STRESS-TEST-${Date.now()}-${i}`,
        status: 'PAID',
        paymentStatus: 'paid',
        email: `test${i}@example.com`,
        customerName: `Test Customer ${i}`,
        fulfillmentMethod: 'shipping',
        fulfillmentStatus: 'PENDING',
        items: [{
          id: 'item-0',
          productId: 'test-product',
          title: `Test Product ${i}`,
          qty: 1,
          unitPrice: 2000,
        }],
        subtotal: 2000,
        shipping: 0,
        tax: 0,
        total: 2000,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
        paidAt: now,
      };
      
      const orderRef = await db.collection('orders').add(testOrder);
      
      // Immediately verify
      const verifyDoc = await orderRef.get();
      if (verifyDoc.exists) {
        const savedData = verifyDoc.data();
        const hasTimestamp = !!savedData?.createdAt && typeof savedData.createdAt.toDate === 'function';
        
        results.push({
          orderNumber: i,
          orderId: orderRef.id,
          success: hasTimestamp,
          createdAt: hasTimestamp ? savedData.createdAt.toDate().toISOString() : null,
          error: hasTimestamp ? null : 'Timestamp missing or invalid',
        });
        
        if (hasTimestamp) {
          console.log(`✅ Order ${i}: Timestamp verified - ${savedData.createdAt.toDate().toISOString()}`);
        } else {
          console.error(`❌ Order ${i}: Timestamp MISSING!`);
        }
      } else {
        results.push({
          orderNumber: i,
          orderId: orderRef.id,
          success: false,
          createdAt: null,
          error: 'Order was not saved',
        });
        console.error(`❌ Order ${i}: Failed to save`);
      }
      
      // Small delay between orders
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`🧪 STRESS TEST COMPLETE: ${successCount}/10 orders have timestamps`);
    
    return NextResponse.json({
      success: failureCount === 0,
      message: `Stress test complete: ${successCount}/10 orders have timestamps`,
      results,
      summary: {
        total: 10,
        success: successCount,
        failed: failureCount,
        successRate: `${(successCount / 10 * 100).toFixed(0)}%`,
      },
    });
  } catch (error: any) {
    console.error('❌ Stress test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
    }, { status: 500 });
  }
}

