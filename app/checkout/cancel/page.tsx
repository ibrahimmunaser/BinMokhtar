'use client';

import { Container } from '@/components/layout/Container';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';

export default function CheckoutCancelPage() {
  const count = useCartStore((state) => state.count());

  return (
    <Container className="py-12 lg:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Cancel Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-orange-600" />
          </div>
        </div>

        {/* Cancel Message */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl lg:text-5xl mb-4">
            Checkout Cancelled
          </h1>
          <p className="text-xl text-bmr-muted mb-6">
            Your payment was not processed. No charges were made.
          </p>
        </div>

        {/* Information Box */}
        <div className="bg-surface-2 rounded-lg border border-line p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">What happened?</h2>
          <div className="space-y-4 text-bmr-muted">
            <p>
              You cancelled the checkout process or closed the payment window. Your cart items are still saved and ready when you're ready to complete your purchase.
            </p>
            <p>
              If you experienced any issues during checkout, please don't hesitate to contact our support team.
            </p>
          </div>
        </div>

        {/* Cart Status */}
        {count > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Your cart is saved</p>
                <p className="text-sm text-blue-700">
                  You still have {count} item{count !== 1 ? 's' : ''} in your cart
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cart"
            className="px-8 py-4 bg-bmr-ink text-surface-2 text-center font-medium uppercase tracking-wideish hover:bg-bmr-fg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Cart
          </Link>
          <Link
            href="/shop"
            className="px-8 py-4 bg-surface-3 text-bmr-ink text-center font-medium uppercase tracking-wideish hover:bg-surface-3/80 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-bmr-muted mb-2">Had trouble checking out?</p>
          <Link href="/contact" className="text-bmr-ink hover:underline text-sm font-medium">
            Contact Support →
          </Link>
        </div>
      </div>
    </Container>
  );
}

