import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { CartTable } from '@/components/cart/CartTable';
import { OrderSummary } from '@/components/cart/OrderSummary';

export default function CartPage() {
  return (
    <div className="bg-surface-1 min-h-screen">
      <div className="container-narrow py-12 lg:py-16">
        <Breadcrumbs items={[{ label: 'Cart', href: '/cart' }]} />

        <div className="mt-12">
          <h1 className="font-display text-4xl lg:text-5xl mb-12">Shopping Cart</h1>

          <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-12">
            {/* Cart Items */}
            <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
              <CartTable />
            </div>

            {/* Order Summary */}
            <aside className="mt-8 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
              <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
                <OrderSummary />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}



