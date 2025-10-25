'use client';

import Image from 'next/image';
import Link from 'next/link';

interface RecProductCardProps {
  product: any; // compatible with both minimal and extended product shapes
  badge?: string | null;
}

export function RecProductCard({ product, badge = null }: RecProductCardProps) {
  const title: string = product.title || product.titleEn || 'Untitled';
  const slug: string = product.slug || product.id;
  const image: string | undefined = product.image || product.thumbnail || product.defaultImage?.url || product.images?.[0];
  const priceCents: number = typeof product.price === 'number' ? product.price : (product.basePrice || 0);
  const priceDisplay = `$${(priceCents / 100).toFixed(2)}`;

  return (
    <Link href={`/product/${slug}`} className="group block w-[180px] sm:w-[200px]">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface-3">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="180px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-bmr-muted">No Image</div>
        )}

        {badge && (
          <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs bg-bmr-ink text-surface-2">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-sm leading-snug">{title}</h3>
        <p className="text-sm font-medium">{priceDisplay}</p>
      </div>
    </Link>
  );
}



