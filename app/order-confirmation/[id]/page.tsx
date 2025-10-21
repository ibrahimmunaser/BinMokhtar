'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { getOrderById } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';
import { CheckCircle } from 'lucide-react';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <Container className="py-12">
        <div className="text-center text-muted">Loading order...</div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-display mb-4">Order not found</h1>
          <Link href="/shop" className="text-muted hover:text-bmr-black underline">
            Continue shopping
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-bmr-black" />
          <h1 className="text-3xl lg:text-4xl font-display mb-4">Order Confirmed!</h1>
          <p className="text-lg text-muted mb-2">Thank you for your order</p>
          <p className="text-sm text-muted">
            Order #{orderId}
          </p>
          <p className="text-sm text-muted mt-2">
            A confirmation email has been sent to {order.email}
          </p>
        </div>

        {/* Order Summary */}
        <div className="border border-border p-6 lg:p-8 mb-8">
          <h2 className="text-xl font-display mb-6">Order Summary</h2>

          <div className="space-y-4 mb-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                {item.image && (
                  <div className="w-20 h-24 bg-border flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  {(item.size || item.color || item.sleeve) && (
                    <div className="text-sm text-muted mt-1">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.size && (item.color || item.sleeve) && <span> · </span>}
                      {item.color && <span className="capitalize">Color: {item.color}</span>}
                      {item.color && item.sleeve && <span> · </span>}
                      {item.sleeve && <span className="capitalize">{item.sleeve} Sleeve</span>}
                    </div>
                  )}
                  <div className="mt-2 text-sm">
                    Qty: {item.qty} × {formatPrice(item.price, 'USD')}
                  </div>
                </div>
                <div className="font-medium">
                  {formatPrice(item.price * item.qty, 'USD')}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrice(order.subtotal, 'USD')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Shipping</span>
              <span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping, 'USD')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Tax</span>
              <span>{formatPrice(order.tax || 0, 'USD')}</span>
            </div>
            <div className="flex justify-between font-medium text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatPrice(order.total, 'USD')}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border border-border p-6 lg:p-8 mb-8">
          <h2 className="text-xl font-display mb-4">Shipping Address</h2>
          <address className="not-italic text-sm text-muted">
            {order.shippingAddress.fullName || order.shippingAddress.name}<br />
            {order.shippingAddress.address || order.shippingAddress.line1}<br />
            {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip || order.shippingAddress.postal}<br />
            {order.shippingAddress.country}
            {order.shippingAddress.phone && (
              <><br />Phone: {order.shippingAddress.phone}</>
            )}
          </address>
        </div>

        <div className="text-center">
          <Link
            href="/shop"
            className="inline-block px-8 py-3 bg-bmr-black text-bmr-white text-sm uppercase tracking-wider hover:bg-muted transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </Container>
  );
}
