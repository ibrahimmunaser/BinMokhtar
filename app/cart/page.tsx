import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { CartTable } from '@/components/cart/CartTable';
import { OrderSummary } from '@/components/cart/OrderSummary';

export const metadata = {
  title: 'Shopping Cart',
  description: 'Review your cart and proceed to checkout',
};

export default function CartPage() {
  return (
    <div className="bg-surface-1 min-h-screen">
      <div className="container-narrow py-8 lg:py-12">
        <Breadcrumbs items={[{ label: 'Cart', href: '/cart' }]} />

        <div className="mt-8">
          <h1 className="font-display text-3xl lg:text-4xl mb-8">Shopping Cart</h1>

          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
            {/* Cart Items - Main Content */}
            <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
              <CartTable />
            </div>

            {/* Order Summary - Sidebar */}
            <aside className="mt-6 lg:mt-0">
              <div className="lg:sticky lg:top-24">
                <div className="bg-surface-2 rounded-lg border border-line p-6">
                <OrderSummary />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
