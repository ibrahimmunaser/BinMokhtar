'use client';

import { useState, useEffect } from 'react';
import { Star, User, ChevronDown, ChevronUp } from 'lucide-react';
import type { Review } from '@/types';

interface ProductReviewsProps {
  productId: string;
  reviewCount?: number;
  ratingAvg?: number;
}

export function ProductReviews({ productId, reviewCount = 0, ratingAvg = 0 }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/reviews?productId=${productId}&limit=50`);
        const data = await response.json();
        if (data.success) {
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [productId]);

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => r.rating === rating).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { rating, count, percentage };
  });

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-3 rounded w-40" />
          <div className="h-20 bg-surface-3 rounded" />
          <div className="h-20 bg-surface-3 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  // Calculate actual rating average from reviews
  const actualRatingAvg = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : ratingAvg;

  return (
    <div className="py-8">
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-surface-3/50 rounded-lg">
          <Star className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">No reviews yet</p>
          <p className="text-sm text-muted mt-1">Be the first to review this product</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* LEFT: Amazon-style Summary Section */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24">
              <h2 className="text-xl font-bold mb-3">Customer reviews</h2>
              
              {/* Star Rating + Average */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-[#FF9900]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        actualRatingAvg >= star 
                          ? 'fill-current' 
                          : actualRatingAvg >= star - 0.5 
                            ? 'fill-current opacity-50' 
                            : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-base font-medium">{actualRatingAvg.toFixed(1)} out of 5</span>
              </div>
              
              {/* Global Ratings Count */}
              <p className="text-sm text-muted mb-6">
                {reviews.length} global rating{reviews.length !== 1 ? 's' : ''}
              </p>

              {/* Rating Distribution Bars */}
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, percentage }) => (
                  <div key={rating} className="flex items-center gap-3 group cursor-pointer">
                    <span className="text-sm text-[#007185] hover:text-[#c7511f] hover:underline w-14 shrink-0">
                      {rating} star
                    </span>
                    <div className="flex-1 h-5 bg-[#F0F2F2] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-[#FFA41C] transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-[#007185] hover:text-[#c7511f] hover:underline w-12 text-right shrink-0">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Reviews List */}
          <div className="flex-1 lg:border-l lg:border-border lg:pl-12">
            <div>
              {displayedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {/* Show More Button */}
            {reviews.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-6 w-full py-3 border border-border rounded-lg font-medium hover:bg-surface-3 transition-colors flex items-center justify-center gap-2"
              >
                {showAll ? (
                  <>
                    Show Less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show All {reviews.length} Reviews <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="pb-8 mb-8 border-b border-border last:border-0 last:mb-0 last:pb-0">
      {/* Reviewer Name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#E0E0E0] flex items-center justify-center">
          <User className="w-6 h-6 text-[#5C5C5C]" />
        </div>
        <span className="text-base font-medium">{review.userDisplayName}</span>
      </div>

      {/* Star Rating + Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex text-[#FF9900]">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${star <= review.rating ? 'fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
        {review.title && (
          <span className="font-bold text-base">{review.title}</span>
        )}
      </div>

      {/* Date */}
      <p className="text-sm text-muted mb-2">
        Reviewed on {formatDate(review.createdAt)}
      </p>

      {/* Variant Info + Verified Badge */}
      <div className="flex items-center gap-2 text-sm mb-4">
        {review.size && (
          <span className="text-muted">Size: {review.size}</span>
        )}
        {review.color && (
          <>
            {review.size && <span className="text-muted">|</span>}
            <span className="text-muted">Color: {review.color}</span>
          </>
        )}
        {review.approved && (
          <>
            {(review.size || review.color) && <span className="text-muted">|</span>}
            <span className="text-[#c45500] font-medium">Verified Purchase</span>
          </>
        )}
      </div>

      {/* Review Body */}
      {review.body && (
        <p className="text-base leading-relaxed">{review.body}</p>
      )}
    </div>
  );
}

