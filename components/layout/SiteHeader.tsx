'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, User, ShoppingBag } from 'lucide-react';
import { MainNav } from './MainNav';
import { MobileNavDrawer } from './MobileNavDrawer';
import { SearchDialog } from './SearchDialog';
import { LocaleCurrencySwitch } from './LocaleCurrencySwitch';
import { useCartStore } from '@/store/cart';

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const cartCount = useCartStore((state) => state.count());

  return (
    <>
      <header className="sticky top-0 z-40 bg-bmr-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-8">
            {/* Left: Mobile menu / Logo */}
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-bmr-black hover:text-muted"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link href="/" className="flex flex-col items-center leading-none">
                <span className="font-display text-3xl font-bold tracking-tight">BMR</span>
                <span className="font-display text-[9px] tracking-[0.3em] mt-0.5">BIN MUKHTAR RETAIL</span>
              </Link>
            </div>

            {/* Center: Desktop nav */}
            <div className="flex-1 flex justify-center">
              <MainNav />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4 lg:gap-6 shrink-0">
              <LocaleCurrencySwitch />
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-bmr-black hover:text-muted"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link
                href="/account"
                className="text-bmr-black hover:text-muted"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>
              <Link
                href="/cart"
                className="relative text-bmr-black hover:text-muted"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-bmr-black text-bmr-white text-xs flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <MobileNavDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

