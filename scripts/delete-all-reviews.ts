/**
 * Delete All Reviews Script
 * 
 * This script removes ALL reviews from the Firestore database
 * and resets the review counts on all products.
 * 
 * Usage: npx tsx scripts/delete-all-reviews.ts
 */

import 'dotenv/config';
import { adminDb } from '../lib/firebase/server';

async function deleteAllReviews() {
  console.log('🗑️  Starting review deletion process...\n');

  try {
    const db = adminDb();
    
    // Get all reviews
    const reviewsSnapshot = await db.collection('reviews').get();
    const reviewCount = reviewsSnapshot.size;

    if (reviewCount === 0) {
      console.log('✅ No reviews found in the database.');
      return;
    }

    console.log(`📊 Found ${reviewCount} reviews to delete\n`);

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

    console.log(`\n✅ Successfully deleted ${deletedCount} reviews\n`);

    // Update product review statistics
    if (productsToUpdate.size > 0) {
      console.log(`🔄 Updating ${productsToUpdate.size} products to reset review stats...\n`);

      let updatedCount = 0;
      const productIds = Array.from(productsToUpdate);

      // Process in batches of 500
      for (let i = 0; i < productIds.length; i += 500) {
        const batchIds = productIds.slice(i, i + 500);
        const updateBatch = db.batch();

        for (const productId of batchIds) {
          const productRef = db.collection('products').doc(productId);
          updateBatch.update(productRef, {
            'counts.reviewCount': 0,
            'counts.ratingAvg': 0,
          });
          updatedCount++;
        }

        await updateBatch.commit();
        console.log(`   Updated ${updatedCount}/${productsToUpdate.size} products...`);
      }

      console.log(`\n✅ Successfully reset review stats for ${updatedCount} products\n`);
    }

    console.log('🎉 Review cleanup complete! Your website is fresh and ready.\n');
  } catch (error) {
    console.error('❌ Error deleting reviews:', error);
    throw error;
  }
}

// Run the script
deleteAllReviews()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
