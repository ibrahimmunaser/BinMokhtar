import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

/**
 * GET /api/admin/orders/test
 * Test endpoint to verify orders exist in database
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  console.log('🧪 ===== TEST ORDERS ENDPOINT CALLED =====');
  
  try {
    const db = adminDb();
    const ordersRef = db.collection('orders');
    
    // Get total count
    const countSnapshot = await ordersRef.count().get();
    const totalCount = countSnapshot.data().count;
    console.log('🧪 Total orders in database:', totalCount);
    
    // Get all orders (no limit for testing)
    const snapshot = await ordersRef.get();
    console.log('🧪 Documents retrieved:', snapshot.size);
    
    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status,
        email: data.email,
        stripeSessionId: data.stripeSessionId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        fulfillmentMethod: data.fulfillmentMethod,
        itemsCount: data.items?.length || 0,
      };
    });
    
    return NextResponse.json({
      success: true,
      totalCount,
      documentCount: snapshot.size,
      orders: orders.slice(0, 20), // Return first 20 for testing
    });
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}























