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
        {products.map((product) => (
          <ProductCard
            key={product.id}
            variant={{
              id: product.id,
              productId: product.id,
              productSlug: product.slug,
              productTitleEn: product.titleEn || (product as any).name,
              productTitleAr: product.titleAr || (product as any).name,
              category: (product as any).category || 'THOBE',
              sku: product.id,
              size: product.sizes?.[0],
              price: product.price || product.basePrice,
              compareAt: undefined,
              stock: product.counts?.totalStock ?? (product as any).stock ?? 0,
              active: true,
              imageUrl: product.defaultImage?.url || (product as any).thumbnail,
              createdAt: product.createdAt,
              updatedAt: product.updatedAt,
            }}
            showSoldOut
          />
        ))}
      </div>
    </div>
  );
}




