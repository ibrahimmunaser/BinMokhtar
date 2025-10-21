import { Container } from '@/components/layout/Container';

export default function PrivacyPage() {
  return (
    <Container narrow className="py-16 lg:py-24">
      <h1 className="font-display text-4xl lg:text-5xl mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none space-y-8">
        <p className="text-muted">Last updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2 className="font-display text-2xl mb-4">Introduction</h2>
          <p>
            Bin Mukhtar Retail ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li>Name, email address, phone number</li>
            <li>Shipping and billing addresses</li>
            <li>Payment information (processed securely by our payment provider)</li>
            <li>Order history and preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Improve our products and services</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:privacy@binmukhtarretail.com" className="text-bmr-black hover:underline">
              privacy@binmukhtarretail.com
            </a>
          </p>
        </section>
      </div>
    </Container>
  );
}




