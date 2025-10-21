'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { signOut } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/types';

export default function AccountPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Helper function to convert Firestore Timestamp or Date to Date object
  const toDate = (timestamp: any): Date => {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date();
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('email', '==', user.email),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(ordersData);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    }

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <Container className="py-12">
        <div className="text-center text-muted">Loading...</div>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container className="py-12 lg:py-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display mb-2">My Account</h1>
            <p className="text-muted">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 border border-border text-sm uppercase tracking-wider hover:bg-border/30 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Orders */}
        <section>
          <h2 className="text-2xl font-display mb-6">Order History</h2>

          {loadingOrders ? (
            <div className="text-center text-muted py-12">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 border border-border">
              <p className="text-muted mb-6">You haven't placed any orders yet.</p>
              <a
                href="/shop"
                className="inline-block px-8 py-3 bg-bmr-black text-bmr-white text-sm uppercase tracking-wider hover:bg-muted transition-colors"
              >
                Start Shopping
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-muted mt-1">
                        {toDate(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total, 'USD')}</p>
                      <p className="text-sm text-muted mt-1 capitalize">{order.status}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted mb-2">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="text-xs">
                          {item.title}
                          {item.qty > 1 && ` (×${item.qty})`}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="text-xs text-muted">
                          +{order.items.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-4">
                    <a
                      href={`/track-order?orderId=${order.id}&email=${order.email}`}
                      className="text-sm underline hover:text-muted"
                    >
                      Track Order
                    </a>
                    <a
                      href={`/order-confirmation/${order.id}`}
                      className="text-sm underline hover:text-muted"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
