'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Container } from './Container';
import { CreditCard } from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // TODO: Implement newsletter signup with Resend
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <footer className="bg-bmr-night text-surface-2 mt-24">
      <Container>
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Newsletter */}
            <div>
              <h3 className="text-lg font-medium mb-4">Keep Updated</h3>
              <p className="text-sm opacity-75 mb-6">
                Subscribe for exclusive offers, restock alerts, and the latest launches.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:border-white/40 placeholder:text-white/40"
                  disabled={status === 'loading'}
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-surface-2 text-bmr-ink rounded text-sm font-medium hover:bg-surface-3 transition-colors disabled:opacity-50"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Sending...' : status === 'success' ? 'Sent!' : 'Subscribe'}
                </button>
              </form>
            </div>

            {/* Logo/Brand (Center) */}
            <div className="flex items-center justify-center opacity-25">
              <Link href="/" className="inline-block">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="font-display text-7xl font-bold tracking-tighter leading-none">BMR</span>
                </div>
              </Link>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-medium mb-4">Follow Us</h3>
              <div className="space-y-3">
                <a href="#" className="block text-sm opacity-75 hover:opacity-100 transition-opacity">
                  Instagram
                </a>
                <a href="#" className="block text-sm opacity-75 hover:opacity-100 transition-opacity">
                  Facebook
                </a>
                <a href="#" className="block text-sm opacity-75 hover:opacity-100 transition-opacity">
                  TikTok
                </a>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-white/10">
            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Information</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm opacity-75 hover:opacity-100 transition-opacity">About Us</Link></li>
                <li><Link href="/size-guide" className="text-sm opacity-75 hover:opacity-100 transition-opacity">Size Guide</Link></li>
                <li><Link href="/care" className="text-sm opacity-75 hover:opacity-100 transition-opacity">Care Instructions</Link></li>
                <li><Link href="/bulk-orders" className="text-sm opacity-75 hover:opacity-100 transition-opacity">Bulk Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Customer Service</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-sm opacity-75 hover:opacity-100 transition-opacity">Contact Us</Link></li>
                <li><Link href="/shipping-returns" className="text-sm opacity-75 hover:opacity-100 transition-opacity">Shipping & Returns</Link></li>
                <li><Link href="/faq" className="text-sm opacity-75 hover:opacity-100 transition-opacity">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/legal/privacy" className="text-sm opacity-75 hover:opacity-100 transition-opacity">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="text-sm opacity-75 hover:opacity-100 transition-opacity">Terms of Service</Link></li>
                <li><Link href="/legal/returns" className="text-sm opacity-75 hover:opacity-100 transition-opacity">Return Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Payment Icons */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 opacity-50">
              <CreditCard className="w-8 h-5" />
              <span className="text-xs">We accept all major payment methods</span>
            </div>
            <div className="text-xs opacity-50 text-center md:text-right">
              &copy; {new Date().getFullYear()} Bin Mukhtar Retail. All rights reserved.
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

