import { NextRequest, NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase/server';

// GET - Fetch reviews for a product
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    const limitParam = searchParams.get('limit');

    const db = adminDb();
    const reviewsRef = db.collection('reviews');
    let query: FirebaseFirestore.Query = reviewsRef;

    if (productId) {
      // Simple query without ordering to avoid index requirement
      query = query.where('productId', '==', productId);
    } else if (userId && orderId) {
      query = query.where('userId', '==', userId)
                   .where('orderId', '==', orderId);
    } else if (userId) {
      query = query.where('userId', '==', userId);
    } else {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (limitParam) {
      query = query.limit(parseInt(limitParam));
    }

    const snapshot = await query.get();
    
    // Filter approved reviews in memory and sort by createdAt desc
    let reviews = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || null,
      }))
      .filter((review: any) => productId ? review.approved === true : true)
      .sort((a: any, b: any) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

    return NextResponse.json({ reviews, success: true });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// POST - Create a new review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      productSlug,
      productTitle,
      orderId,
      orderItemId,
      userId,
      userDisplayName,
      userPhotoURL,
      rating,
      title,
      body: reviewBody,
      size,
      color,
    } = body;

    // Validate required fields
    if (!productId || !orderId || !orderItemId || !userId || !rating) {
      return NextResponse.json({ 
        error: 'Missing required fields: productId, orderId, orderItemId, userId, rating',
        success: false 
      }, { status: 400 });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5',
        success: false 
      }, { status: 400 });
    }

    const db = adminDb();
    
    // Check if user already reviewed this item
    const existingReviewQuery = await db.collection('reviews')
      .where('userId', '==', userId)
      .where('orderId', '==', orderId)
      .where('orderItemId', '==', orderItemId)
      .limit(1)
      .get();

    if (!existingReviewQuery.empty) {
      return NextResponse.json({ 
        error: 'You have already reviewed this item',
        success: false 
      }, { status: 400 });
    }

    // Create review
    const reviewData = {
      productId,
      productSlug: productSlug || '',
      productTitle: productTitle || '',
      orderId,
      orderItemId,
      userId,
      userDisplayName: userDisplayName || 'Anonymous',
      userPhotoURL: userPhotoURL || null,
      rating,
      title: title || null,
      body: reviewBody || null,
      size: size || null,
      color: color || null,
      approved: true, // Auto-approve, change to false for moderation
      pinnedHome: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('reviews').add(reviewData);

    // Update product review stats
    await updateProductReviewStats(productId);

    return NextResponse.json({ 
      success: true, 
      reviewId: docRef.id,
      message: 'Review submitted successfully'
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// Helper function to update product review statistics
async function updateProductReviewStats(productId: string) {
  try {
    const db = adminDb();
    const reviewsSnapshot = await db.collection('reviews')
      .where('productId', '==', productId)
      .where('approved', '==', true)
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => doc.data());
    const reviewCount = reviews.length;
    const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const ratingAvg = reviewCount > 0 ? Math.round((ratingSum / reviewCount) * 10) / 10 : 0;

    await db.collection('products').doc(productId).update({
      'counts.reviewCount': reviewCount,
      'counts.ratingAvg': ratingAvg,
    });
  } catch (error) {
    console.error('Error updating product review stats:', error);
  }
}

