'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { getOrderById } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

export default function TrackOrderPage() {
  const [formData, setFormData] = useState({ email: '', orderId: '' });
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const orderData = await getOrderById(formData.orderId);
      
      if (!orderData) {
        setError('Order not found. Please check your order ID and try again.');
        return;
      }

      // Verify email matches
      if (orderData.email.toLowerCase() !== formData.email.toLowerCase()) {
        setError('Email does not match our records for this order.');
        return;
      }

      setOrder(orderData);
    } catch (err) {
      console.error('Track order error:', err);
      setError('Failed to retrieve order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-muted';
      case 'paid':
        return 'text-bmr-black';
      case 'shipped':
        return 'text-bmr-black';
      case 'cancelled':
        return 'text-muted';
      default:
        return 'text-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
      case 'paid':
        return 'Payment Confirmed';
      case 'shipped':
        return 'Shipped';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Container className="py-12 lg:py-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl lg:text-5xl font-display mb-8 text-center">Track Your Order</h1>
        
        <p className="text-lg text-muted mb-12 text-center">
          Enter your order details to check the status of your shipment.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 mb-12">
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium mb-2">
              Order ID *
            </label>
            <input
              type="text"
              id="orderId"
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              placeholder="e.g., ABC123XYZ"
              required
              className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
            <p className="mt-2 text-xs text-muted">
              You can find your order ID in the confirmation email we sent you.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 bg-bmr-black text-bmr-white text-sm uppercase tracking-wider hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>

          {error && (
            <div className="p-4 border border-border bg-border/30">
              <p className="text-sm text-center">{error}</p>
            </div>
          )}
        </form>

        {/* Order Details */}
        {order && (
          <div className="space-y-8">
            <div className="border border-border p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display mb-2">Order #{order.id}</h2>
                  <p className="text-sm text-muted">
                    Placed on {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted mb-1">Status</p>
                  <p className={`font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-medium mb-4">Order Items</h3>
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.image && (
                      <div className="w-16 h-20 bg-border flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      {(item.size || item.color || item.sleeve) && (
                        <p className="text-xs text-muted mt-1">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.size && (item.color || item.sleeve) && <span> · </span>}
                          {item.color && <span className="capitalize">Color: {item.color}</span>}
                          {item.color && item.sleeve && <span> · </span>}
                          {item.sleeve && <span className="capitalize">{item.sleeve} Sleeve</span>}
                        </p>
                      )}
                      <p className="text-xs text-muted mt-1">Qty: {item.qty}</p>
                    </div>
                    <div className="text-sm">
                      {formatPrice(item.price * item.qty, 'USD')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="border-t border-border mt-6 pt-6 space-y-2">
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
            <div className="border border-border p-6 lg:p-8">
              <h3 className="font-medium mb-4">Shipping Address</h3>
              <address className="not-italic text-sm text-muted">
                {order.shippingAddress.fullName || order.shippingAddress.name}<br />
                {order.shippingAddress.address || order.shippingAddress.line1}<br />
                {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip || order.shippingAddress.postal}<br />
                {order.shippingAddress.country}
              </address>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}


