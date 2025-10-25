'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Review } from '@/types';
import { cn } from '@/lib/utils';

interface ReviewsCarouselProps {
  eyebrow?: string;
  rating?: number;
  reviewCount?: number;
  reviews: Review[];
}

export function ReviewsCarousel({
  eyebrow = 'Let our customers speak for us',
  rating = 5,
  reviewCount = 1000,
  reviews,
}: ReviewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!reviews || reviews.length === 0) return null;

  const visibleReviews = 3;
  const maxIndex = Math.max(0, reviews.length - visibleReviews);

  const next = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <section className="py-16 lg:py-24 bg-surface-2">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm uppercase tracking-wideish text-bmr-muted mb-3">
            {eyebrow}
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-5 h-5",
                  i < rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                )}
              />
            ))}
            <span className="ml-2 text-sm text-bmr-muted">
              from {reviewCount.toLocaleString()}+ reviews
            </span>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleReviews + 2)}%)`,
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex-shrink-0 w-full md:w-[calc(33.333%-1rem)] bg-surface-1 rounded-lg p-8"
                >
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < review.rating
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>

                  {/* Title */}
                  {review.title && (
                    <h4 className="font-medium text-lg mb-3">
                      {review.title}
                    </h4>
                  )}

                  {/* Body */}
                  {review.body && (
                    <p className="text-bmr-muted mb-4 leading-relaxed">
                      {review.body}
                    </p>
                  )}

                  {/* Name */}
                  {review.name && (
                    <p className="text-sm font-medium text-bmr-stone">
                      — {review.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          {reviews.length > visibleReviews && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className="w-10 h-10 flex items-center justify-center border border-line rounded-full hover:bg-surface-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Previous reviews"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-bmr-muted">
                {currentIndex + 1} / {maxIndex + 1}
              </span>
              <button
                onClick={next}
                disabled={currentIndex === maxIndex}
                className="w-10 h-10 flex items-center justify-center border border-line rounded-full hover:bg-surface-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Next reviews"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}







