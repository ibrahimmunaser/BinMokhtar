/**
 * Stripe Configuration
 * Server-side Stripe instance
 * Lazy-loaded to prevent build-time errors when env vars are not set
 */

import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Get or create Stripe instance
 * Throws error only when actually used, not at module load time
 */
function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    // If no key is set, create a dummy instance to allow build to complete
    // The API routes will check for the key at runtime and return proper errors
    // This prevents build failures when env vars aren't set during build time
    const keyToUse = secretKey || 'sk_test_dummy_key_for_build_time_only_do_not_use_in_production';
    
    stripeInstance = new Stripe(keyToUse, {
      apiVersion: '2023-10-16',
      typescript: true,
      appInfo: {
        name: 'Bin Mukhtar Retail',
        version: '1.0.0',
      },
    });
  }
  return stripeInstance;
}

// Export stripe as a Proxy that lazily initializes
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = instance[prop as keyof Stripe];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

// Stripe publishable key for client-side
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Webhook secret for signature verification
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

