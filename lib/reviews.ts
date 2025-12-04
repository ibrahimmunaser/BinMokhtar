import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Review, ReviewFormData } from '@/types';

const REVIEWS_COLLECTION = 'reviews';

/**
 * Submit a new review
 */
export async function submitReview(
  data: ReviewFormData,
  userId: string,
  userDisplayName: string,
  userPhotoURL?: string
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // Check if user already reviewed this item
    const existingReview = await getUserReviewForOrderItem(userId, data.orderId, data.orderItemId);
    if (existingReview) {
      return { success: false, error: 'You have already reviewed this item' };
    }

    const reviewData = {
      productId: data.productId,
      productSlug: data.productSlug,
      productTitle: data.productTitle,
      orderId: data.orderId,
      orderItemId: data.orderItemId,
      userId,
      userDisplayName,
      userPhotoURL: userPhotoURL || null,
      rating: data.rating,
      title: data.title || null,
      body: data.body || null,
      approved: true, // Auto-approve reviews, can change to false for moderation
      pinnedHome: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewData);
    
    // Update product review count and average (optional - can be done via Cloud Function)
    await updateProductReviewStats(data.productId);

    return { success: true, reviewId: docRef.id };
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return { success: false, error: error.message || 'Failed to submit review' };
  }
}

/**
 * Update an existing review
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  data: { rating?: number; title?: string; body?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) {
      return { success: false, error: 'Review not found' };
    }
    
    const review = reviewSnap.data();
    if (review.userId !== userId) {
      return { success: false, error: 'You can only edit your own reviews' };
    }

    await updateDoc(reviewRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Update product stats if rating changed
    if (data.rating) {
      await updateProductReviewStats(review.productId);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating review:', error);
    return { success: false, error: error.message || 'Failed to update review' };
  }
}

/**
 * Delete a review
 */
export async function deleteReview(
  reviewId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) {
      return { success: false, error: 'Review not found' };
    }
    
    const review = reviewSnap.data();
    if (review.userId !== userId) {
      return { success: false, error: 'You can only delete your own reviews' };
    }

    const productId = review.productId;
    await deleteDoc(reviewRef);
    
    // Update product stats
    await updateProductReviewStats(productId);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return { success: false, error: error.message || 'Failed to delete review' };
  }
}

/**
 * Get all reviews for a product
 */
export async function getProductReviews(
  productId: string,
  options: { limit?: number; approvedOnly?: boolean } = {}
): Promise<Review[]> {
  try {
    const constraints: any[] = [
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
    ];
    
    if (options.approvedOnly !== false) {
      constraints.splice(1, 0, where('approved', '==', true));
    }
    
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(collection(db, REVIEWS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as Review;
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return [];
  }
}

/**
 * Get all reviews by a user
 */
export async function getUserReviews(userId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as Review;
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
}

/**
 * Check if user has reviewed a specific order item
 */
export async function getUserReviewForOrderItem(
  userId: string,
  orderId: string,
  orderItemId: string
): Promise<Review | null> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId),
      where('orderId', '==', orderId),
      where('orderItemId', '==', orderItemId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as Review;
  } catch (error) {
    console.error('Error checking existing review:', error);
    return null;
  }
}

/**
 * Get all reviews for items in an order
 */
export async function getOrderReviews(
  userId: string,
  orderId: string
): Promise<Map<string, Review>> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId),
      where('orderId', '==', orderId)
    );
    const snapshot = await getDocs(q);
    
    const reviewMap = new Map<string, Review>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const review = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as Review;
      reviewMap.set(data.orderItemId, review);
    });
    
    return reviewMap;
  } catch (error) {
    console.error('Error fetching order reviews:', error);
    return new Map();
  }
}

/**
 * Update product review statistics
 * Note: This is a simple implementation. For production, use Cloud Functions
 */
async function updateProductReviewStats(productId: string): Promise<void> {
  try {
    const reviews = await getProductReviews(productId, { approvedOnly: true });
    
    const reviewCount = reviews.length;
    const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const ratingAvg = reviewCount > 0 ? Math.round((ratingSum / reviewCount) * 10) / 10 : 0;

    // Update product document
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      'counts.reviewCount': reviewCount,
      'counts.ratingAvg': ratingAvg,
    });
  } catch (error) {
    console.error('Error updating product review stats:', error);
  }
}

