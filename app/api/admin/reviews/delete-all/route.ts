import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminSession } from '@/lib/adminSessionToken';

/**
 * DELETE /api/admin/reviews/delete-all
 * 
 * Deletes ALL reviews from the database and resets product review stats.
 * This is an admin-only endpoint for cleaning up test data.
 */
export async function DELETE(req: NextRequest) {
  const authError = requireAdminSession(req);
  if (authError) return authError;
  try {
    const db = adminDb();

    console.log('🗑️  Starting review deletion process...');

    // Get all reviews
    const reviewsSnapshot = await db.collection('reviews').get();
    const reviewCount = reviewsSnapshot.size;

    if (reviewCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reviews found in the database',
        deletedCount: 0,
        productsUpdated: 0,
      });
    }

    console.log(`📊 Found ${reviewCount} reviews to delete`);

    // Track unique products that need stats updates
    const productsToUpdate = new Set<string>();
    
    // Delete reviews in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    let deletedCount = 0;

    for (let i = 0; i < reviewsSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const docsToDelete = reviewsSnapshot.docs.slice(i, i + batchSize);

      docsToDelete.forEach((doc) => {
        const reviewData = doc.data();
        if (reviewData.productId) {
          productsToUpdate.add(reviewData.productId);
        }
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      console.log(`   Deleted ${deletedCount}/${reviewCount} reviews...`);
    }

    console.log(`✅ Successfully deleted ${deletedCount} reviews`);

    // Update product review statistics
    let updatedCount = 0;
    if (productsToUpdate.size > 0) {
      console.log(`🔄 Updating ${productsToUpdate.size} products to reset review stats...`);

      const productIds = Array.from(productsToUpdate);

      // Process in batches of 500
      for (let i = 0; i < productIds.length; i += 500) {
        const batch = db.batch();
        const batchIds = productIds.slice(i, i + 500);

        for (const productId of batchIds) {
          try {
            // Check if product exists before trying to update
            const productRef = db.collection('products').doc(productId);
            const productSnap = await productRef.get();
            
            if (productSnap.exists) {
              batch.update(productRef, {
                'counts.reviewCount': 0,
                'counts.ratingAvg': 0,
              });
              updatedCount++;
            } else {
              console.log(`   Skipping non-existent product: ${productId}`);
            }
          } catch (error) {
            console.error(`   Error checking product ${productId}:`, error);
          }
        }

        if (updatedCount > 0) {
          await batch.commit();
          console.log(`   Updated ${updatedCount}/${productsToUpdate.size} products...`);
        }
      }

      console.log(`✅ Successfully reset review stats for ${updatedCount} products`);
    }

    console.log('🎉 Review cleanup complete!');

    return NextResponse.json({
      success: true,
      message: 'Successfully deleted all reviews',
      deletedCount,
      productsUpdated: updatedCount,
    });
  } catch (error: any) {
    console.error('❌ Error deleting reviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete reviews',
        deletedCount: 0,
        productsUpdated: 0,
      },
      { status: 500 }
    );
  }
}
