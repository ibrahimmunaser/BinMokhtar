'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Container } from './Container';
import { Instagram, Facebook, CreditCard } from 'lucide-react';

// TikTok icon component (not available in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(2024);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentYear(new Date().getFullYear());
    }
  }, []);

  return (
    <footer className="bg-bmr-night text-surface-2 mt-24">
      <Container>
        <div className="py-16 lg:py-20">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            
            {/* Brand Section */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block mb-6">
                <span className="font-display text-4xl font-bold tracking-tighter">BMR</span>
              </Link>
              <p className="text-sm opacity-60 mb-6 max-w-xs">
                Premium traditional attire crafted with excellence. Luxury thobes and modest fashion for the modern gentleman.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a 
                  href="https://www.instagram.com/binmukhtarretail/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.facebook.com/p/Bin-Mukhtar-Retail-61573231778600/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-all"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.tiktok.com/@binmukhtarretail" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-all"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-xs font-semibold mb-5 uppercase tracking-widest opacity-40">Shop</h4>
                  <ul className="space-y-3">
                    <li><Link href="/category/men" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Men's Thobes</Link></li>
                    <li><Link href="/category/boys" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Boys' Thobes</Link></li>
                    <li><Link href="/category/shemaghs" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Shemaghs</Link></li>
                    <li><Link href="/shop" className="text-sm opacity-70 hover:opacity-100 transition-opacity">All Products</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-5 uppercase tracking-widest opacity-40">Help</h4>
                  <ul className="space-y-3">
                    <li><Link href="/contact" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Contact Us</Link></li>
                    <li><Link href="/shipping-returns" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Shipping & Returns</Link></li>
                    <li><Link href="/size-guide" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Size Guide</Link></li>
                    <li><Link href="/faq" className="text-sm opacity-70 hover:opacity-100 transition-opacity">FAQ</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-5 uppercase tracking-widest opacity-40">Company</h4>
                  <ul className="space-y-3">
                    <li><Link href="/about" className="text-sm opacity-70 hover:opacity-100 transition-opacity">About Us</Link></li>
                    <li><Link href="/legal/privacy" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Privacy Policy</Link></li>
                    <li><Link href="/legal/terms" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Terms of Service</Link></li>
                    <li><Link href="/legal/returns" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Return Policy</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 opacity-40">
                <CreditCard className="w-6 h-4" />
                <span className="text-xs">Secure payments</span>
              </div>
              <div className="text-xs opacity-40 text-center">
                &copy; {currentYear} Bin Mukhtar Retail. All rights reserved.
              </div>
              <div className="text-xs opacity-30">
                Built by Hikmah Web Studio
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
