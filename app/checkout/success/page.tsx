'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { useCartStore } from '@/store/cart';
import { CheckCircle, Package, Truck, Mail } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clear = useCartStore((state) => state.clear);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const session_id = searchParams.get('session_id');
    
    if (session_id) {
      setSessionId(session_id);
      // Clear cart on successful payment
      clear();
    } else {
      // Redirect to homepage if no session ID
      setTimeout(() => router.push('/'), 3000);
    }
  }, [searchParams, clear, router]);

  if (!sessionId) {
    return (
      <Container className="py-12 text-center">
        <p className="text-bmr-muted">Redirecting...</p>
      </Container>
    );
  }

  return (
    <Container className="py-12 lg:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl lg:text-5xl mb-4">
            Thank You for Your Order!
          </h1>
          <p className="text-xl text-bmr-muted mb-6">
            Your payment was successful and your order is confirmed.
          </p>
          <p className="text-sm text-bmr-muted">
            Order Reference: <code className="px-2 py-1 bg-surface-3 rounded text-bmr-ink font-mono text-xs">{sessionId.slice(-12)}</code>
          </p>
        </div>

        {/* What's Next Section */}
        <div className="bg-surface-2 rounded-lg border border-line p-8 mb-8">
          <h2 className="text-2xl font-display mb-6">What happens next?</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-bmr-ink/10 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-bmr-ink" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Order Confirmation Email</h3>
                <p className="text-sm text-bmr-muted">
                  You'll receive a confirmation email with your order details and receipt within the next few minutes.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-bmr-ink/10 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-bmr-ink" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Order Processing</h3>
                <p className="text-sm text-bmr-muted">
                  Our team will carefully prepare your order. This usually takes 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-bmr-ink/10 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-bmr-ink" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Shipping & Tracking</h3>
                <p className="text-sm text-bmr-muted">
                  Once shipped, you'll receive tracking information via email to monitor your delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="px-8 py-4 bg-bmr-ink text-surface-2 text-center font-medium uppercase tracking-wideish hover:bg-bmr-fg transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="px-8 py-4 bg-surface-3 text-bmr-ink text-center font-medium uppercase tracking-wideish hover:bg-surface-3/80 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center text-sm text-bmr-muted">
          <p>Need help with your order?</p>
          <Link href="/contact" className="text-bmr-ink hover:underline">
            Contact our support team
          </Link>
        </div>
      </div>
    </Container>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <Container className="py-12 text-center">
        <p className="text-bmr-muted">Loading...</p>
      </Container>
    }>
      <SuccessContent />
    </Suspense>
  );
}

