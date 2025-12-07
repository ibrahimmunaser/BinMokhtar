import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase/server';
import { Order } from '@/types';

/**
 * GET /api/admin/orders
 * Fetch all orders (admin only)
 * Uses Admin SDK to bypass Firestore security rules
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('📋 ===== ADMIN ORDERS API CALLED =====');
  console.log('📋 Timestamp:', new Date().toISOString());
  console.log('📋 Request URL:', request.url);
  console.log('📋 Request method:', request.method);
  console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));
  console.log('📋 Request IP:', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');
  
  try {
    // Note: In production, you should verify admin session here
    // For now, we'll rely on the client-side admin auth check
    
    console.log('📋 Step 1: Initializing Firebase Admin...');
    let db;
    try {
      db = adminDb();
      console.log('✅ Step 1: Firebase Admin initialized');
    } catch (firebaseError: any) {
      console.error('❌ Step 1: Firebase Admin initialization failed');
      console.error('❌ Error message:', firebaseError?.message);
      console.error('❌ Error stack:', firebaseError?.stack);
      throw firebaseError;
    }
    
    console.log('📋 Step 2: Querying orders collection...');
    const ordersRef = db.collection('orders');
    
    // Get all orders (we'll sort in memory to handle missing createdAt)
    console.log('📋 Step 2: Executing Firestore query (limit 100)...');
    const snapshot = await ordersRef.limit(100).get();
    console.log('✅ Step 2: Query executed successfully');
    console.log('✅ Step 2: Documents found:', snapshot.size);
    
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
    
    console.log('📋 Step 3: Converting documents to orders array...');
    // Convert and sort orders
    const orders = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      const converted = {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings for JSON serialization
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        paidAt: convertTimestamp(data.paidAt),
      } as unknown as Order;
      
      // Log first few orders for debugging
      if (index < 3) {
        console.log(`📋 Step 3: Order ${index + 1}:`, {
          id: converted.id,
          status: converted.status,
          email: converted.email,
          createdAt: converted.createdAt,
          itemsCount: converted.items?.length,
        });
      }
      
      return converted;
    });
    console.log('✅ Step 3: Converted', orders.length, 'orders');
    
    // AUTOMATIC REPAIR: Fix any orders with missing timestamps (runs in background)
    const ordersNeedingFix = snapshot.docs.filter((doc, index) => {
      const data = doc.data();
      const needsFix = !data.createdAt || 
                       typeof data.createdAt?.toDate !== 'function' ||
                       !data.createdAt?._seconds;
      if (needsFix && index < 5) {
        console.log(`🔧 Order ${doc.id} needs timestamp repair`);
      }
      return needsFix;
    });
    
    if (ordersNeedingFix.length > 0) {
      console.log(`🔧 AUTO-REPAIR: Found ${ordersNeedingFix.length} orders with missing timestamps - fixing automatically...`);
      // Fix them BEFORE returning response (synchronous)
      const fixPromises = ordersNeedingFix.map(async (doc) => {
        try {
          const data = doc.data();
          // Use updatedAt or paidAt if available, otherwise use now
          const timestamp = (data.updatedAt && typeof data.updatedAt.toDate === 'function') 
            ? data.updatedAt 
            : (data.paidAt && typeof data.paidAt.toDate === 'function')
            ? data.paidAt
            : Timestamp.now();
          
          await doc.ref.update({
            createdAt: timestamp,
            updatedAt: Timestamp.now(),
            paidAt: data.paidAt || timestamp,
          });
          console.log(`✅ Auto-fixed timestamps for order ${doc.id}`);
          return { success: true, orderId: doc.id };
        } catch (error: any) {
          console.error(`❌ Failed to auto-fix order ${doc.id}:`, error?.message);
          return { success: false, orderId: doc.id, error: error?.message };
        }
      });
      
      // Wait for all fixes to complete
      const fixResults = await Promise.all(fixPromises);
      const successCount = fixResults.filter(r => r.success).length;
      console.log(`✅ AUTO-REPAIR COMPLETE: Fixed ${successCount} of ${ordersNeedingFix.length} orders`);
      
        // Re-fetch the fixed orders to get updated timestamps
        if (successCount > 0) {
          console.log('🔄 Re-fetching fixed orders to get updated timestamps...');
          const fixedDocs = await Promise.all(ordersNeedingFix.map(doc => doc.ref.get()));
          fixedDocs.forEach((fixedDoc, index) => {
            if (fixedDoc.exists) {
              const fixedData = fixedDoc.data();
              if (fixedData) {
                const originalIndex = orders.findIndex(o => o.id === fixedDoc.id);
                if (originalIndex >= 0) {
                  // Update with converted timestamps (as string | null)
                  (orders[originalIndex] as any).createdAt = convertTimestamp(fixedData.createdAt);
                  (orders[originalIndex] as any).updatedAt = convertTimestamp(fixedData.updatedAt);
                  (orders[originalIndex] as any).paidAt = convertTimestamp(fixedData.paidAt);
                }
              }
            }
          });
          console.log('✅ Updated orders array with fixed timestamps');
        }
    } else {
      console.log('✅ All orders have valid timestamps');
    }
    
    console.log('📋 Step 4: Sorting orders by date/time (newest first)...');
    // Sort by createdAt descending - newest orders at top
    // Orders without createdAt go to the TOP for visibility (likely new/problematic)
    orders.sort((a, b) => {
      const aCreated = (a.createdAt as unknown) as string | null;
      const bCreated = (b.createdAt as unknown) as string | null;
      
      // Handle null/missing timestamps
      if (!aCreated && !bCreated) return 0;
      if (!aCreated) return -1; // a goes BEFORE b (show at top for visibility)
      if (!bCreated) return 1; // b goes BEFORE a (show at top for visibility)
      
      // Both have timestamps - sort newest first (descending)
      const aTime = new Date(aCreated).getTime();
      const bTime = new Date(bCreated).getTime();
      return bTime - aTime; // Descending: newest first
    });
    console.log('✅ Step 4: Orders sorted by date/time (newest first)');
    
    console.log('📋 Step 5: Preparing response...');
    console.log('📋 Step 5: Total orders to return:', orders.length);
    console.log('📋 Step 5: First order ID:', orders[0]?.id);
    console.log('📋 Step 5: First order createdAt:', orders[0]?.createdAt);
    console.log('📋 Step 5: Last order ID:', orders[orders.length - 1]?.id);
    
    const response = { orders, success: true };
    const duration = Date.now() - startTime;
    console.log('✅ ===== ADMIN ORDERS API SUCCESS =====');
    console.log('✅ Total duration:', duration, 'ms');
    console.log('✅ Returning', orders.length, 'orders');
    console.log('✅ Response size estimate:', JSON.stringify(response).length, 'bytes');
    console.log('✅ First order sample:', orders[0] ? {
      id: orders[0].id,
      status: orders[0].status,
      email: orders[0].email,
      createdAt: orders[0].createdAt,
    } : 'N/A');
    
    const jsonResponse = NextResponse.json(response);
    console.log('✅ Response created, status:', jsonResponse.status);
    console.log('✅ Response headers:', Object.fromEntries(jsonResponse.headers.entries()));
    return jsonResponse;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ ===== ADMIN ORDERS API ERROR =====');
    console.error('❌ Error timestamp:', new Date().toISOString());
    console.error('❌ Duration before error:', duration, 'ms');
    console.error('❌ Error type:', error?.constructor?.name);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error cause:', error?.cause);
    console.error('❌ Full error object:', error);
    console.error('❌ Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    const errorResponse = NextResponse.json(
      { error: error.message || 'Failed to fetch orders', success: false },
      { status: 500 }
    );
    console.error('❌ Error response created, status:', errorResponse.status);
    return errorResponse;
  }
}

