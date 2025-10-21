'use client';

import { useState } from 'react';

export default function BulkOrdersPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    quantity: '',
    productInterest: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you! Our bulk orders team will contact you within 24 hours.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      eventType: '',
      eventDate: '',
      quantity: '',
      productInterest: '',
      notes: '',
    });
  };

  return (
    <div className="bg-surface-1 min-h-screen">
      <div className="container-narrow py-12 lg:py-20">
        <h1 className="font-display text-4xl lg:text-5xl mb-6 text-center">Bulk Orders</h1>
        
        <p className="text-lg text-bmr-muted mb-16 text-center max-w-2xl mx-auto">
          Planning a wedding, corporate event, or large gathering? We offer special pricing for bulk orders of 10+ items.
        </p>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Benefits */}
          <div className="bg-surface-2 rounded-lg border border-line p-8">
            <h2 className="font-display text-2xl mb-6">Why Order in Bulk?</h2>
            
            <div className="space-y-6">
              {[
                {
                  title: 'Volume Discounts',
                  description: '10-20 items: 10% off | 21-50 items: 15% off | 51+ items: 20% off',
                },
                {
                  title: 'Priority Service',
                  description: 'Dedicated account manager and expedited processing for your order',
                },
                {
                  title: 'Customization Options',
                  description: 'Custom embroidery, special sizing, and color coordination available',
                },
                {
                  title: 'Flexible Payment',
                  description: 'NET 30 terms available for qualified orders over $1,000',
                },
              ].map((benefit) => (
                <div key={benefit.title}>
                  <h3 className="font-medium mb-2">{benefit.title}</h3>
                  <p className="text-sm text-bmr-muted">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-surface-2 rounded-lg border border-line p-8">
            <h2 className="font-display text-2xl mb-6">Request a Quote</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Event Type *</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                >
                  <option value="">Select event type</option>
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="religious">Religious Gathering</option>
                  <option value="school">School/Organization</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Event Date (Approximate)</label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity Needed *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  min="10"
                  placeholder="Minimum 10 items"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Product Interest</label>
                <input
                  type="text"
                  value={formData.productInterest}
                  onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                  placeholder="e.g., White Thobes, Shemaghs"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Any special requirements or questions?"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink resize-none"
                />
              </div>

              <button type="submit" className="w-full btn-primary">
                Submit Request
              </button>

              <p className="text-sm text-bmr-muted text-center">
                Our team will respond within 24 hours with a custom quote
              </p>
            </form>
          </div>
        </div>

        {/* Popular Bulk Orders */}
        <div className="bg-bmr-night text-surface-2 rounded-lg p-8 lg:p-12">
          <h2 className="font-display text-2xl lg:text-3xl mb-8 text-center">Popular Bulk Orders</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Wedding Parties',
                description: 'Matching thobes for grooms, groomsmen, and family members',
              },
              {
                title: 'Corporate Uniforms',
                description: 'Professional Islamic attire for company events and dress codes',
              },
              {
                title: 'School Uniforms',
                description: 'Durable, comfortable thobes for students of all ages',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="font-medium text-lg mb-3">{item.title}</h3>
                <p className="opacity-90 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
