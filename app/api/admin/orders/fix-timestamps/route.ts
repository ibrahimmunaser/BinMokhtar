import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/orders/fix-timestamps
 * Fix orders with missing createdAt timestamps
 * Sets createdAt to current time for orders that don't have it
 */
export async function POST(request: NextRequest) {
  console.log('🔧 ===== FIX TIMESTAMPS MIGRATION STARTED =====');
  console.log('🔧 Timestamp:', new Date().toISOString());
  
  try {
    const db = adminDb();
    const ordersRef = db.collection('orders');
    
    // Get all orders
    console.log('🔧 Step 1: Fetching all orders...');
    const snapshot = await ordersRef.get();
    console.log('🔧 Step 1: Found', snapshot.size, 'orders');
    
    let fixedCount = 0;
    let alreadyGoodCount = 0;
    const errors: string[] = [];
    
    console.log('🔧 Step 2: Processing orders...');
    
    // Process in batches of 500 (Firestore batch write limit)
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check if createdAt is missing or null
      if (!data.createdAt) {
        console.log(`🔧 Fixing order ${doc.id} - missing createdAt`);
        
        // Set timestamps to now (we don't have the original creation time)
        // If updatedAt exists, use that as a better approximation
        const timestamp = data.updatedAt || data.paidAt || Timestamp.now();
        
        batch.update(doc.ref, {
          createdAt: timestamp,
          updatedAt: Timestamp.now(),
        });
        
        fixedCount++;
        batchCount++;
        
        // Commit batch if we hit the limit
        if (batchCount >= batchSize) {
          console.log(`🔧 Committing batch of ${batchCount} updates...`);
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      } else {
        alreadyGoodCount++;
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      console.log(`🔧 Committing final batch of ${batchCount} updates...`);
      await batch.commit();
    }
    
    console.log('✅ ===== FIX TIMESTAMPS MIGRATION COMPLETE =====');
    console.log('✅ Fixed:', fixedCount, 'orders');
    console.log('✅ Already had timestamps:', alreadyGoodCount, 'orders');
    console.log('✅ Total processed:', snapshot.size, 'orders');
    
    return NextResponse.json({
      success: true,
      message: 'Timestamps fixed successfully',
      stats: {
        total: snapshot.size,
        fixed: fixedCount,
        alreadyGood: alreadyGoodCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('❌ ===== FIX TIMESTAMPS MIGRATION ERROR =====');
    console.error('❌ Error:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fix timestamps',
      },
      { status: 500 }
    );
  }
}

