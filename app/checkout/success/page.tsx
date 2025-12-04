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
  const [fulfillmentMethod, setFulfillmentMethod] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckedParams, setHasCheckedParams] = useState(false);

  useEffect(() => {
    // Get session_id from URL - try searchParams first, then fallback to window.location
    let session_id = searchParams?.get('session_id');
    
    // Fallback: parse from window.location if searchParams doesn't have it yet
    if (!session_id && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      session_id = urlParams.get('session_id');
    }
    
    if (session_id) {
      setSessionId(session_id);
      setHasCheckedParams(true);
      // Clear cart on successful payment
      clear();
      
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        setIsLoadingSession(false);
      }, 5000);
      
      // Fetch session details to get fulfillment method
      fetch(`/api/stripe/get-session?session_id=${session_id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch session');
          }
          return res.json();
        })
        .then(data => {
          clearTimeout(timeout);
          if (data.metadata?.fulfillmentMethod) {
            setFulfillmentMethod(data.metadata.fulfillmentMethod);
          }
          setIsLoadingSession(false);
        })
        .catch(err => {
          clearTimeout(timeout);
          console.error('Error fetching session:', err);
          setError('Unable to load order details, but your payment was successful.');
          setIsLoadingSession(false);
        });
    } else if (!hasCheckedParams) {
      // First check - wait a moment for searchParams to populate
      const checkTimeout = setTimeout(() => {
        setHasCheckedParams(true);
      }, 500);
      return () => clearTimeout(checkTimeout);
    } else {
      // Already checked and no session_id found - redirect to homepage
      setIsLoadingSession(false);
      setTimeout(() => router.push('/'), 3000);
    }
  }, [searchParams, clear, router, hasCheckedParams]);

  // Show loading while we're still checking for session_id
  if (!sessionId && !hasCheckedParams) {
    return (
      <Container className="py-12 lg:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-bmr-ink border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg text-bmr-muted">Loading order details...</p>
        </div>
      </Container>
    );
  }

  if (!sessionId && hasCheckedParams) {
    return (
      <Container className="py-12 lg:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-bmr-muted mb-4">No session found. Redirecting...</p>
          <Link
            href="/"
            className="text-bmr-ink hover:underline"
          >
            Go to homepage
          </Link>
        </div>
      </Container>
    );
  }

  if (isLoadingSession) {
    return (
      <Container className="py-12 lg:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-bmr-ink border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg text-bmr-muted">Loading order details...</p>
        </div>
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

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

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

            {fulfillmentMethod === 'delivery' ? (
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
            ) : (
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-bmr-ink/10 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-bmr-ink" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Pickup Arrangement</h3>
                  <p className="text-sm text-bmr-muted">
                    Send us a DM on Instagram to arrange your pickup time and location in the Detroit Metro Area.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pickup Instructions - Show Instagram DM button for pickup orders */}
        {fulfillmentMethod === 'pickup' && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-8 mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Arrange Your Pickup</h3>
                <p className="text-sm text-bmr-muted mb-4">
                  To arrange pickup for your order, please send us a direct message on Instagram with your order reference.
                </p>
                <a
                  href="https://www.instagram.com/binmukhtarretail?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>DM on Instagram</span>
                </a>
              </div>
            </div>
          </div>
        )}

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
      <Container className="py-12 lg:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-bmr-ink border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg text-bmr-muted">Loading order details...</p>
        </div>
      </Container>
    }>
      <SuccessContent />
    </Suspense>
  );
}

