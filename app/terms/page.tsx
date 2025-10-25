import { Container } from '@/components/layout/Container';

export default function TermsPage() {
  return (
    <Container narrow className="py-16 lg:py-24">
      <h1 className="font-display text-4xl lg:text-5xl mb-8">Terms of Service</h1>
      
      <div className="prose prose-lg max-w-none space-y-8">
        <p className="text-muted">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2 className="font-display text-2xl mb-4">Agreement to Terms</h2>
          <p>
            By accessing and using Bin Mukhtar Retail's website, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Use License</h2>
          <p>
            Permission is granted to temporarily access the materials on BMR's website for personal, non-commercial transitory viewing only.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Product Information</h2>
          <p>
            We strive to provide accurate product information. However, we do not warrant that product descriptions, pricing, or other content is accurate, complete, or error-free.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Pricing and Payment</h2>
          <p>
            All prices are in USD unless otherwise stated. We reserve the right to change prices at any time. Payment must be received before orders are processed.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Returns and Refunds</h2>
          <p>
            Please refer to our Shipping & Returns page for detailed information about our return policy.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Limitation of Liability</h2>
          <p>
            BMR shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our products or services.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@binmukhtarretail.com" className="text-bmr-black hover:underline">
              legal@binmukhtarretail.com
            </a>
          </p>
        </section>
      </div>
    </Container>
  );
}









