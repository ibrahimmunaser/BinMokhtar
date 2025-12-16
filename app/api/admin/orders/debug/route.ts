import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

/**
 * GET /api/admin/orders/debug
 * Debug endpoint to check orders and webhook status
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('🔍 ===== DEBUG ORDERS ENDPOINT CALLED =====');
  
  try {
    const db = adminDb();
    const ordersRef = db.collection('orders');
    
    // Get total count
    const countSnapshot = await ordersRef.count().get();
    const totalCount = countSnapshot.data().count;
    console.log('🔍 Total orders in database:', totalCount);
    
    // Get all orders
    const snapshot = await ordersRef.orderBy('createdAt', 'desc').limit(10).get();
    console.log('🔍 Recent orders retrieved:', snapshot.size);
    
    const recentOrders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status,
        email: data.email,
        stripeSessionId: data.stripeSessionId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        fulfillmentMethod: data.fulfillmentMethod,
        itemsCount: data.items?.length || 0,
        total: data.total,
        paymentStatus: data.paymentStatus,
      };
    });
    
    // Also check for orders without createdAt (legacy)
    const allSnapshot = await ordersRef.limit(100).get();
    const allOrders = allSnapshot.docs.map((doc) => ({
      id: doc.id,
      hasCreatedAt: !!doc.data().createdAt,
      hasStripeSessionId: !!doc.data().stripeSessionId,
      status: doc.data().status,
    }));
    
    const ordersWithoutCreatedAt = allOrders.filter(o => !o.hasCreatedAt);
    const ordersWithoutStripeSession = allOrders.filter(o => !o.hasStripeSessionId);
    
    return NextResponse.json({
      success: true,
      totalCount,
      recentOrdersCount: snapshot.size,
      recentOrders,
      summary: {
        totalOrders: allOrders.length,
        ordersWithCreatedAt: allOrders.length - ordersWithoutCreatedAt.length,
        ordersWithoutCreatedAt: ordersWithoutCreatedAt.length,
        ordersWithStripeSession: allOrders.length - ordersWithoutStripeSession.length,
        ordersWithoutStripeSession: ordersWithoutStripeSession.length,
      },
      ordersWithoutCreatedAt: ordersWithoutCreatedAt.slice(0, 10),
      ordersWithoutStripeSession: ordersWithoutStripeSession.slice(0, 10),
    });
  } catch (error: any) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}








