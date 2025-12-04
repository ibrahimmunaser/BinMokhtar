'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { CheckoutAuthPrompt } from '@/components/checkout/CheckoutAuthPrompt';
import { useAuth } from '@/contexts/AuthContext';

export default function CheckoutPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Avoid hydration mismatch by waiting for client mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout', href: '/checkout' },
        ]}
      />

      <h1 className="mt-8 font-display text-3xl lg:text-4xl mb-8">Checkout</h1>

      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
        <div>
          {/* Show auth prompt for guest users - only after hydration */}
          {mounted && !isLoading && !isAuthenticated && (
            <CheckoutAuthPrompt />
          )}
          
          <CheckoutForm />
        </div>
        <aside className="mt-8 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-surface-2 border border-border rounded-lg p-6">
            <OrderSummary showCheckoutButton={false} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
