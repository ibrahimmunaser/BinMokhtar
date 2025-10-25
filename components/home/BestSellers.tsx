'use client';

import Link from 'next/link';
import { ProductCard } from '@/components/products/ProductCard';
import { Variant } from '@/types';
import { ArrowRight } from 'lucide-react';

interface BestSellersProps {
  title?: string;
  linkText?: string;
  linkHref?: string;
  products: Variant[];
  locale?: string;
}

export function BestSellers({
  title = 'Best Sellers',
  linkText = 'Shop Best Sellers',
  linkHref = '/shop',
  products,
  locale = 'en',
}: BestSellersProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-surface-2">
      <div className="container-wide">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-medium">
            {title}
          </h2>
          <Link
            href={linkHref}
            className="hidden md:inline-flex items-center gap-2 text-sm uppercase tracking-wide text-bmr-ink hover:underline"
          >
            {linkText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              variant={product}
              locale={locale}
            />
          ))}
        </div>

        {/* Mobile Link */}
        <div className="mt-12 text-center md:hidden">
          <Link
            href={linkHref}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-wide text-bmr-ink hover:underline"
          >
            {linkText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}







