'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { createOrder } from '@/lib/data';
import { logBeginCheckout, logPurchase } from '@/lib/analytics';

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total());
  const clear = useCartStore((state) => state.clear);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || items.length === 0) return;

    setIsSubmitting(true);
    
    // Track begin checkout
    logBeginCheckout(items, total);

    try {
      const orderId = await createOrder({
        email: formData.email,
        shippingAddress: {
          fullName: formData.fullName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
          phone: formData.phone,
        },
        items,
        subtotal: total,
        total,
        status: 'pending',
      });
      
      // Track purchase
      logPurchase(orderId, items, total);

      clear();
      router.push(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to create order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-display mb-4">Contact Information</h2>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email address"
          required
          className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
        />
      </div>

      <div>
        <h2 className="text-xl font-display mb-4">Shipping Address</h2>
        <div className="space-y-4">
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full name"
            required
            className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
          />
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            required
            className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              required
              className="px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State / Province"
              required
              className="px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              placeholder="ZIP / Postal code"
              required
              className="px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country"
              required
              className="px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone (optional)"
            className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-8 py-4 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-bmr-black/90 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Processing...' : 'Place Order'}
      </button>

      <p className="text-xs text-muted text-center">
        This is a demo checkout. No payment will be processed.
      </p>
    </form>
  );
}

