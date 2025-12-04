'use client';

import { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; title: string; body: string }) => Promise<void>;
  productTitle: string;
  productImage?: string;
  existingReview?: {
    rating: number;
    title?: string;
    body?: string;
  };
}

export function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  productTitle,
  productImage,
  existingReview,
}: ReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [body, setBody] = useState(existingReview?.body || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, title, body });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface-2 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-2 px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-display">
            {existingReview ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-3 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Product Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            {productImage && (
              <img 
                src={productImage} 
                alt={productTitle}
                className="w-16 h-16 object-cover rounded-lg border border-border"
              />
            )}
            <div>
              <p className="text-sm text-muted">You're reviewing</p>
              <p className="font-medium">{productTitle}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              Overall Rating <span className="text-bmr-acc-red">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-3 text-sm text-muted">
                  {displayRating === 1 && 'Poor'}
                  {displayRating === 2 && 'Fair'}
                  {displayRating === 3 && 'Good'}
                  {displayRating === 4 && 'Very Good'}
                  {displayRating === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          {/* Review Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Review Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your experience in a few words"
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night/20 focus:border-bmr-night transition-colors"
              maxLength={100}
            />
          </div>

          {/* Review Body */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Your Review
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell others about your experience with this product. What did you like or dislike?"
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night/20 focus:border-bmr-night transition-colors resize-none"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted mt-1 text-right">
              {body.length}/1000
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-surface-3 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-3 bg-bmr-night text-white rounded-lg font-medium hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                existingReview ? 'Update Review' : 'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

