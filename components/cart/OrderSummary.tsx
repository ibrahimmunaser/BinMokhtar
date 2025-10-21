'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

interface OrderSummaryProps {
  showCheckoutButton?: boolean;
}

export function OrderSummary({ showCheckoutButton = true }: OrderSummaryProps) {
  const total = useCartStore((state) => state.total());
  const count = useCartStore((state) => state.count());
  const { currency } = useLocale();

  const shipping = 0; // Free shipping
  const tax = 0; // Calculate if needed
  const grandTotal = total + shipping + tax;

  return (
    <div className="bg-bmr-white p-6 lg:p-8 border border-border">
      <h2 className="text-xl font-display mb-6">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal ({count} items)</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Tax</span>
          <span>{tax === 0 ? 'Calculated at checkout' : formatPrice(tax, currency)}</span>
        </div>
        <div className="pt-3 border-t border-border flex justify-between text-base font-medium">
          <span>Total</span>
          <span>{formatPrice(grandTotal, currency)}</span>
        </div>
      </div>

      {showCheckoutButton && (
        <Link
          href="/checkout"
          className="mt-6 block w-full text-center px-8 py-4 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-bmr-black/90 transition-colors"
        >
          Proceed to Checkout
        </Link>
      )}

      <Link
        href="/shop"
        className="mt-4 block text-center text-sm text-muted hover:text-bmr-black underline"
      >
        Continue Shopping
      </Link>
    </div>
  );
}


