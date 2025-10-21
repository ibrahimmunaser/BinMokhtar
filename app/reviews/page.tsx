'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { mockReviews } from '@/lib/mockData';

export default function ReviewsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    title: '',
    body: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your review! It will be published after moderation.');
    setFormData({ name: '', email: '', rating: 5, title: '', body: '' });
  };

  return (
    <div className="bg-surface-1 min-h-screen">
      <div className="container-narrow py-12 lg:py-20">
        <h1 className="font-display text-4xl lg:text-5xl mb-6 text-center">Customer Reviews</h1>
        
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 fill-yellow-500 text-yellow-500" />
            ))}
            <span className="ml-2 text-lg font-medium">5.0</span>
          </div>
          <p className="text-bmr-muted">Based on {mockReviews.length} reviews</p>
        </div>

        {/* Reviews List */}
        <div className="space-y-6 mb-16">
          {mockReviews.map((review) => (
            <div key={review.id} className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <h3 className="font-medium text-lg mb-1">{review.title}</h3>
                  <p className="text-sm text-bmr-muted">{review.name}</p>
                </div>
                <span className="text-sm text-bmr-muted">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-bmr-ink leading-relaxed">{review.body}</p>
            </div>
          ))}
        </div>

        {/* Write Review Form */}
        <div className="bg-surface-2 rounded-lg border border-line p-8 lg:p-12">
          <h2 className="font-display text-2xl lg:text-3xl mb-8">Write a Review</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= formData.rating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300 hover:text-yellow-500'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Review Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Sum up your experience"
                className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Review *</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                required
                rows={6}
                placeholder="Share your thoughts about the product"
                className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink resize-none"
              />
            </div>

            <button type="submit" className="w-full md:w-auto btn-primary">
              Submit Review
            </button>

            <p className="text-sm text-bmr-muted">
              Your review will be published after moderation by our team.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
