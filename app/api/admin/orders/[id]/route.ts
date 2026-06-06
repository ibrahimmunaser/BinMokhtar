import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminSession } from '@/lib/adminSessionToken';

/**
 * GET /api/admin/orders/[id]
 * Fetch a single order by ID (admin only)
 * Uses Admin SDK to bypass Firestore security rules
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  try {
    const orderId = params.id;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required', success: false },
        { status: 400 }
      );
    }
    
    const db = adminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found', success: false },
        { status: 404 }
      );
    }
    
    const data = orderDoc.data();
    
    // Helper function to convert Firestore Timestamps to ISO strings
    const convertTimestamp = (timestamp: any): string | null => {
      if (!timestamp) return null;
      // Firestore Timestamp from Admin SDK
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
      }
      // Already a Date object
      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      }
      // Already an ISO string
      if (typeof timestamp === 'string') {
        return timestamp;
      }
      return null;
    };
    
    const order = {
      id: orderDoc.id,
      ...data,
      // Convert Firestore Timestamps to ISO strings for JSON serialization
      createdAt: convertTimestamp(data?.createdAt),
      updatedAt: convertTimestamp(data?.updatedAt),
      paidAt: convertTimestamp(data?.paidAt),
    };
    
    console.log('📋 Order detail API - Label fields:', {
      orderId: orderDoc.id,
      packingSlipUrl: data?.packingSlipUrl,
      internal_label_url: data?.internal_label_url,
    });
    
    return NextResponse.json({ order, success: true });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order', success: false },
      { status: 500 }
    );
  }
}


