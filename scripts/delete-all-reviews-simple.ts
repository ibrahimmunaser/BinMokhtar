/**
 * Delete All Reviews Script - Simple Version
 * 
 * This script removes ALL reviews by directly accessing Firestore
 * using the client SDK (which doesn't require server env vars).
 * 
 * Usage: npx tsx scripts/delete-all-reviews-simple.ts
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// Initialize Firebase with client config (you can use public keys here)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function deleteAllReviews() {
  console.log('🗑️  Starting review deletion process...\n');

  try {
    // Get all reviews
    const reviewsRef = collection(db, 'reviews');
    const reviewsSnapshot = await getDocs(reviewsRef);
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
      const batch = writeBatch(db);
      const docsToDelete = reviewsSnapshot.docs.slice(i, i + batchSize);

      docsToDelete.forEach((docSnap) => {
        const reviewData = docSnap.data();
        if (reviewData.productId) {
          productsToUpdate.add(reviewData.productId);
        }
        batch.delete(docSnap.ref);
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
        const batch = writeBatch(db);
        const batchIds = productIds.slice(i, i + 500);

        for (const productId of batchIds) {
          const productRef = doc(db, 'products', productId);
          batch.update(productRef, {
            'counts.reviewCount': 0,
            'counts.ratingAvg': 0,
          });
          updatedCount++;
        }

        await batch.commit();
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
