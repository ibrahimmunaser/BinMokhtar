'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { createLead } from '@/lib/data';
import { logNewsletterSignup } from '@/lib/analytics';

export function NewsletterInline() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      await createLead(email, 'newsletter');
      logNewsletterSignup(email);
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <section className="py-20 lg:py-32 border-t border-border bg-bmr-white">
      <Container narrow>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-3xl lg:text-4xl mb-4 tracking-tightish">Join Our Community</h2>
          <p className="text-muted mb-10 text-lg">
            Subscribe to receive exclusive updates, new arrivals, and special offers.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-4 border border-border focus:outline-none focus:border-bmr-black bg-bmr-white text-base"
              disabled={status === 'loading'}
              required
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-10 py-4 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-muted transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {status === 'loading' ? 'Sending...' : 'Subscribe'}
            </button>
          </form>
          {status === 'success' && (
            <p className="mt-4 text-sm text-bmr-black font-medium">✓ Thank you for subscribing!</p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-sm text-bmr-black font-medium">✕ Something went wrong. Please try again.</p>
          )}
        </div>
      </Container>
    </section>
  );
}

