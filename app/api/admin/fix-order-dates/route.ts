import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase/server';
import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/adminSessionToken';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/fix-order-dates
 * One-time migration to fix orders with missing/empty createdAt timestamps
 */
export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  try {
    const db = adminDb();
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.get();
    
    let fixed = 0;
    let skipped = 0;
    const results: { id: string; status: string }[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const createdAt = data.createdAt;
      
      // Check if createdAt is missing or empty
      const needsFix = !createdAt || 
        (typeof createdAt === 'object' && 
         !createdAt.seconds && 
         !createdAt._seconds && 
         typeof createdAt.toDate !== 'function');
      
      if (needsFix) {
        // Update with server timestamp
        await doc.ref.update({
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        fixed++;
        results.push({ id: doc.id, status: 'fixed' });
      } else {
        skipped++;
        results.push({ id: doc.id, status: 'ok' });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed} orders, skipped ${skipped} orders that already had valid timestamps`,
      fixed,
      skipped,
      total: snapshot.docs.length,
      results,
    });
  } catch (error: any) {
    console.error('Error fixing order dates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/fix-order-dates
 * Check which orders need fixing without making changes
 */
export async function GET() {
  try {
    const db = adminDb();
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.get();
    
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      
      const needsFix = !createdAt || 
        (typeof createdAt === 'object' && 
         !createdAt.seconds && 
         !createdAt._seconds && 
         typeof createdAt.toDate !== 'function');
      
      return {
        id: doc.id,
        hasValidTimestamp: !needsFix,
        createdAtType: typeof createdAt,
        createdAtKeys: createdAt ? Object.keys(createdAt) : [],
      };
    });
    
    const needsFix = orders.filter(o => !o.hasValidTimestamp).length;
    
    return NextResponse.json({
      success: true,
      total: orders.length,
      needsFix,
      alreadyValid: orders.length - needsFix,
      orders,
    });
  } catch (error: any) {
    console.error('Error checking order dates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

