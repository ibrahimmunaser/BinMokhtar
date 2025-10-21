import { Container } from '@/components/layout/Container';

export default function ShippingReturnsPage() {
  return (
    <Container className="py-12 lg:py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl lg:text-5xl font-display mb-8 text-center">Shipping & Returns</h1>
        
        <div className="space-y-12">
          {/* Shipping */}
          <section>
            <h2 className="text-2xl font-display mb-6">Shipping Information</h2>
            <div className="space-y-4 text-muted">
              <p>
                We offer worldwide shipping to ensure our customers can enjoy our products no matter where they are.
              </p>
              
              <h3 className="text-xl font-display text-bmr-black mt-6 mb-3">Shipping Rates</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Orders over $99: FREE standard shipping</li>
                <li>Orders under $99: $9.99 standard shipping</li>
                <li>Express shipping: $19.99 (2-3 business days)</li>
              </ul>

              <h3 className="text-xl font-display text-bmr-black mt-6 mb-3">Processing Time</h3>
              <p>
                Orders are typically processed within 1-2 business days. You will receive a tracking number via email once your order ships.
              </p>

              <h3 className="text-xl font-display text-bmr-black mt-6 mb-3">Delivery Time</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Domestic (US): 3-7 business days</li>
                <li>International: 7-14 business days</li>
                <li>Express: 2-3 business days</li>
              </ul>
            </div>
          </section>

          {/* Returns */}
          <section className="border-t border-border pt-12">
            <h2 className="text-2xl font-display mb-6">Return Policy</h2>
            <div className="space-y-4 text-muted">
              <p>
                We want you to be completely satisfied with your purchase. If you're not happy with your order, we offer easy returns within 14 days of delivery.
              </p>

              <h3 className="text-xl font-display text-bmr-black mt-6 mb-3">Return Conditions</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Items must be unused and in original condition</li>
                <li>Items must have all original tags attached</li>
                <li>Items must be returned in original packaging</li>
                <li>Proof of purchase required</li>
              </ul>

              <h3 className="text-xl font-display text-bmr-black mt-6 mb-3">Non-Returnable Items</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Items marked as "Final Sale"</li>
                <li>Custom or personalized items</li>
                <li>Undergarments and intimate items</li>
              </ul>

              <h3 className="text-xl font-display text-bmr-black mt-6 mb-3">How to Return</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Contact us at returns@binmukhtarretail.com to initiate a return</li>
                <li>We'll provide you with a return authorization and shipping label</li>
                <li>Pack the items securely in the original packaging</li>
                <li>Attach the return label and drop off at your nearest shipping location</li>
              </ol>

              <h3 className="text-xl font-display text-bmr-black mt-6 mb-3">Refunds</h3>
              <p>
                Once we receive and inspect your return, we'll process your refund within 5-7 business days. The refund will be issued to your original payment method.
              </p>
            </div>
          </section>

          {/* Exchange */}
          <section className="border-t border-border pt-12">
            <h2 className="text-2xl font-display mb-6">Exchanges</h2>
            <div className="space-y-4 text-muted">
              <p>
                We're happy to exchange items for a different size or color, subject to availability. To request an exchange, please contact us at exchanges@binmukhtarretail.com.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-border/30 p-8 mt-12">
            <h2 className="text-xl font-display mb-4">Need Help?</h2>
            <p className="text-muted">
              If you have any questions about shipping or returns, please don't hesitate to contact our customer service team at support@binmukhtarretail.com or call us at +1 (234) 567-890.
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
