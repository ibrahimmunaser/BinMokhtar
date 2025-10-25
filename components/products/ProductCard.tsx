'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Variant } from '@/types';
import { formatPrice } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  variant: Variant;
  locale?: string;
  showSoldOut?: boolean;
  className?: string;
}

export function ProductCard({ variant, locale = 'en', showSoldOut = false, className }: ProductCardProps) {
  const title = locale === 'ar' ? (variant.productTitleAr || variant.productTitleEn) : (variant.productTitleEn || variant.productTitleAr);
  const price = variant.price || 0;
  const compareAt = variant.compareAt;
  const isOnSale = !!compareAt && compareAt > price;
  const isSoldOut = (variant.stock ?? 0) === 0;

  return (
    <Link
      href={`/product/${variant.productSlug}`}
      className={cn(
        "group block relative",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-surface-3 rounded-lg">
        {variant.imageUrl ? (
          <Image
            src={variant.imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-bmr-muted">
            No Image
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isOnSale && (
            <span className="px-3 py-1 bg-bmr-acc-red text-white text-xs font-medium uppercase tracking-wide rounded-full">
              Sale
            </span>
          )}
          {isSoldOut && showSoldOut && (
            <span className="px-3 py-1 bg-bmr-ink text-white text-xs font-medium uppercase tracking-wide rounded-full">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick Add Button (Desktop) */}
        {!isSoldOut && (
          <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="w-full py-2 bg-white text-bmr-ink text-sm font-medium uppercase tracking-wide rounded-full hover:bg-surface-3 transition-colors">
              Quick Add
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2">
        <h3 className="font-display text-lg leading-tight">
          {title}
        </h3>

        {/* Variant Info */}
        {(variant.size || variant.length || variant.color) && (
          <p className="text-sm text-bmr-muted">
            {[variant.size, variant.length, variant.color]
              .filter(Boolean)
              .join(' • ')}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "text-lg font-medium",
            isSoldOut && "text-bmr-muted"
          )}>
            {formatPrice(price, 'USD', locale === 'ar' ? 'ar-SA' : 'en-US')}
          </span>
          {isOnSale && (
            <span className="text-sm text-bmr-muted line-through">
              {formatPrice(compareAt, 'USD', locale === 'ar' ? 'ar-SA' : 'en-US')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
