'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/products/ProductCard';
import { ShemaghTab, Variant } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ShemaghTabsProps {
  title?: string;
  tabs: ShemaghTab[];
  productsByTab: Record<string, Variant[]>;
  locale?: string;
}

export function ShemaghTabs({
  title = 'Shemagh & Kufi Collections',
  tabs,
  productsByTab,
  locale = 'en',
}: ShemaghTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.slug || '');

  if (!tabs || tabs.length === 0) return null;

  const activeTabData = tabs.find((tab) => tab.slug === activeTab);
  const products = productsByTab[activeTab] || [];

  return (
    <section className="py-16 lg:py-24 bg-surface-1">
      <div className="container-wide">
        {/* Section Title */}
        <h2 className="font-display text-3xl md:text-4xl font-medium text-center mb-12">
          {title}
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {tabs.map((tab) => {
            const label = locale === 'ar' ? tab.labelAr : tab.labelEn;
            const isActive = tab.slug === activeTab;

            return (
              <button
                key={tab.slug}
                onClick={() => setActiveTab(tab.slug)}
                className={cn(
                  "px-6 py-3 text-sm font-medium uppercase tracking-wide rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-bmr-ink text-surface-2"
                    : "bg-surface-2 text-bmr-ink hover:bg-surface-3"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              variant={product}
              locale={locale}
              showSoldOut
            />
          ))}
        </div>

        {/* View All Link */}
        {activeTabData && (
          <div className="mt-12 text-center">
            <Link
              href={`/category/${activeTab}`}
              className="inline-flex items-center gap-2 text-sm uppercase tracking-wide text-bmr-ink hover:underline"
            >
              Shop {locale === 'ar' ? activeTabData.labelAr : activeTabData.labelEn}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}







