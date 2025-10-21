'use client';

import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export function ProductGrid({ products, title }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">No products found.</p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h2 className="font-display text-3xl lg:text-4xl text-center mb-12">{title}</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-6 lg:gap-x-8">
        {products.map((product) => {
          // Map Product to Variant for ProductCard
          const variant: any = {
            id: product.id,
            slug: product.slug,
            titleEn: product.titleEn,
            titleAr: product.titleAr,
            basePrice: product.basePrice,
            image: product.defaultImage,
            inStock: product.counts?.totalStock > 0,
          };
          return <ProductCard key={product.id} variant={variant} />;
        })}
      </div>
    </div>
  );
}




