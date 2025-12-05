import { NextRequest, NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase/server';

// GET - Fetch reviews for a product or homepage
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    const homepage = searchParams.get('homepage');
    const limitParam = searchParams.get('limit');

    const db = adminDb();
    const reviewsRef = db.collection('reviews');
    let query: FirebaseFirestore.Query = reviewsRef;

    // Homepage query: 5-star approved reviews with comments from REAL orders only
    if (homepage === 'true') {
      query = query.where('approved', '==', true)
                   .where('rating', '==', 5);
      
      const snapshot = await query.get();
      
      // Filter to only reviews with body text AND valid orderId (real purchases)
      // Exclude test reviews that have fake productIds or missing orderIds
      let reviews = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            productId: data.productId,
            productSlug: data.productSlug,
            productTitle: data.productTitle,
            orderId: data.orderId,
            rating: data.rating,
            title: data.title,
            body: data.body,
            name: data.userDisplayName || 'Customer',
            approved: data.approved,
            pinnedHome: data.pinnedHome,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
        })
        .filter((review: any) => {
          // Must have body text
          if (!review.body || review.body.trim().length === 0) return false;
          // Must have a real orderId (not test data)
          if (!review.orderId || review.orderId === 'test' || review.orderId.startsWith('test-')) return false;
          // Exclude test productIds
          if (review.productId === 'test' || review.productId === 'product-1' || review.productId?.startsWith('test-')) return false;
          return true;
        })
        .sort((a: any, b: any) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      
      // Look up product details for reviews (slug, title, image)
      const reviewsWithProducts = await Promise.all(
        reviews.map(async (review: any) => {
          if (review.productId) {
            try {
              const productDoc = await db.collection('products').doc(review.productId).get();
              if (productDoc.exists) {
                const productData = productDoc.data();
                return {
                  ...review,
                  productSlug: review.productSlug || productData?.slug || '',
                  productTitle: review.productTitle || productData?.titleEn || productData?.title || '',
                  productImage: productData?.primaryImageUrl || '',
                };
              }
            } catch (e) {
              // If product lookup fails, return review as-is
            }
          }
          return review;
        })
      );
      
      // Apply limit if specified
      if (limitParam) {
        return NextResponse.json({ reviews: reviewsWithProducts.slice(0, parseInt(limitParam)), success: true });
      }
      
      return NextResponse.json({ reviews: reviewsWithProducts, success: true });
    }

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

// DELETE - Remove reviews (admin cleanup)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cleanupTest = searchParams.get('cleanupTest');
    const reviewId = searchParams.get('id');
    
    const db = adminDb();
    
    // Delete specific review by ID
    if (reviewId) {
      await db.collection('reviews').doc(reviewId).delete();
      return NextResponse.json({ 
        success: true, 
        message: `Deleted review ${reviewId}` 
      });
    }
    
    if (cleanupTest === 'true') {
      // Delete all test reviews (productId = 'product-1', 'test', or starts with 'test-')
      const snapshot = await db.collection('reviews').get();
      
      const batch = db.batch();
      let deleteCount = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const isTestReview = 
          data.productId === 'test' || 
          data.productId === 'product-1' || 
          data.productId?.startsWith('test-') ||
          !data.orderId ||
          data.orderId === 'test' ||
          data.orderId?.startsWith('test-');
        
        if (isTestReview) {
          batch.delete(doc.ref);
          deleteCount++;
        }
      });
      
      await batch.commit();
      
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${deleteCount} test reviews` 
      });
    }
    
    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting reviews:', error);
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

