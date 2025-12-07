import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/order-creation
 * Test endpoint to verify order creation with timestamps works correctly
 */
export async function POST(request: NextRequest) {
  console.log('🧪 ===== TEST ORDER CREATION =====');
  
  try {
    const db = adminDb();
    const now = Timestamp.now();
    
    // Create a test order with timestamps
    const testOrder = {
      orderNumber: `TEST-${Date.now()}`,
      status: 'PAID',
      paymentStatus: 'paid',
      email: 'test@example.com',
      customerName: 'Test Customer',
      fulfillmentMethod: 'shipping',
      fulfillmentStatus: 'PENDING',
      items: [{
        id: 'item-0',
        productId: 'test-product',
        title: 'Test Product',
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
    
    console.log('🧪 Creating test order with timestamps...');
    console.log('🧪 createdAt:', now.toDate().toISOString());
    
    const orderRef = await db.collection('orders').add(testOrder);
    console.log('✅ Test order created:', orderRef.id);
    
    // Verify it was saved correctly
    const verifyDoc = await orderRef.get();
    if (verifyDoc.exists) {
      const savedData = verifyDoc.data();
      const hasTimestamp = !!savedData?.createdAt && typeof savedData.createdAt.toDate === 'function';
      
      console.log('🧪 Verification:');
      console.log('🧪 createdAt exists:', !!savedData?.createdAt);
      console.log('🧪 createdAt has toDate:', typeof savedData?.createdAt?.toDate === 'function');
      
      if (hasTimestamp) {
        console.log('✅ SUCCESS: Timestamp was saved correctly!');
        return NextResponse.json({
          success: true,
          message: 'Test order created with timestamps',
          orderId: orderRef.id,
          createdAt: savedData.createdAt.toDate().toISOString(),
          verified: true,
        });
      } else {
        console.error('❌ FAILED: Timestamp was NOT saved correctly!');
        return NextResponse.json({
          success: false,
          message: 'Test order created but timestamp is missing',
          orderId: orderRef.id,
          createdAt: null,
          verified: false,
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'Test order was not saved',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

