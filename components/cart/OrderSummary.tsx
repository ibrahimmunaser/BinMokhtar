'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface OrderSummaryProps {
  showCheckoutButton?: boolean;
}

export function OrderSummary({ showCheckoutButton = true }: OrderSummaryProps) {
  const total = useCartStore((state) => state.total());
  const count = useCartStore((state) => state.count());
  const { currency } = useLocale();
  
  const [containsGift, setContainsGift] = useState(false);

  const shipping = 0; // Free shipping
  const tax = 0; // Calculate if needed
  const grandTotal = total + shipping + tax;
  
  // Free shipping threshold
  const freeShippingThreshold = 10000; // $100 in cents
  const qualifiesForFreeShipping = total >= freeShippingThreshold;

  return (
    <div>
      {/* Free Delivery Banner - Amazon style */}
      {qualifiesForFreeShipping && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                Your order qualifies for FREE delivery.
              </p>
              <p className="text-xs text-green-700 mt-1">
                Choose this option at checkout.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="mb-6">
        <div className="mb-4">
          <p className="text-lg">
            Subtotal ({count} items): <span className="font-bold text-xl">{formatPrice(total, currency)}</span>
          </p>
        </div>

        {/* Gift Checkbox - Amazon style */}
        <div className="mb-4">
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={containsGift}
              onChange={(e) => setContainsGift(e.target.checked)}
              className="w-4 h-4 rounded border-border cursor-pointer mt-0.5"
            />
            <span>This order contains a gift</span>
          </label>
        </div>

        {showCheckoutButton && (
          <Link
            href="/checkout"
            className="block w-full text-center px-8 py-3 bg-bmr-night text-surface-2 text-sm font-medium rounded-lg hover:bg-bmr-night/90 transition-colors shadow-sm"
          >
            Proceed to checkout
          </Link>
        )}
      </div>

      {/* Detailed Breakdown */}
      <div className="pt-6 border-t border-border">
        <h3 className="text-base font-semibold mb-4">Order Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-bmr-muted">Subtotal ({count} items)</span>
            <span>{formatPrice(total, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bmr-muted">Shipping</span>
            <span className="text-green-700 font-medium">{shipping === 0 ? 'FREE' : formatPrice(shipping, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bmr-muted">Tax</span>
            <span className="text-bmr-muted text-xs">{tax === 0 ? 'Calculated at checkout' : formatPrice(tax, currency)}</span>
          </div>
          <div className="pt-3 border-t border-border flex justify-between text-base font-bold">
            <span>Order Total:</span>
            <span className="text-lg">{formatPrice(grandTotal, currency)}</span>
          </div>
        </div>
      </div>

      <Link
        href="/shop"
        className="mt-6 block text-center text-sm text-bmr-ink hover:text-bmr-fg hover:underline"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
