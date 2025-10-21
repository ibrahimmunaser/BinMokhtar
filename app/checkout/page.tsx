import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { OrderSummary } from '@/components/cart/OrderSummary';

export default function CheckoutPage() {
  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout', href: '/checkout' },
        ]}
      />

      <h1 className="mt-8 font-display text-3xl lg:text-4xl mb-8">Checkout</h1>

      <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-12">
        <div>
          <CheckoutForm />
        </div>
        <aside className="mt-8 lg:mt-0">
          <OrderSummary showCheckoutButton={false} />
        </aside>
      </div>
    </Container>
  );
}
