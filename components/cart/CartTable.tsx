'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

export function CartTable() {
  const items = useCartStore((state) => state.items);
  const setQty = useCartStore((state) => state.setQty);
  const remove = useCartStore((state) => state.remove);
  const { currency } = useLocale();

  if (!items.length) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-6">Your cart is empty</p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-bmr-black/90"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.id} className="flex gap-4 pb-6 border-b border-border">
          {/* Thumbnail */}
          <Link
            href={`/product/${item.slug || item.productId}`}
            className="w-24 h-32 bg-border relative flex-shrink-0"
          >
            {(item.image || item.imageUrl) && (
              <Image
                src={item.image || item.imageUrl || ''}
                alt={item.name || item.title}
                fill
                className="object-cover"
                sizes="96px"
              />
            )}
          </Link>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-4">
              <div>
                <Link href={`/product/${item.slug || item.productId}`} className="font-display hover:underline">
                  {item.name || item.title}
                </Link>
                {(item.size || item.color || item.sleeve || item.length) && (
                  <div className="mt-1 text-sm text-muted">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.size && (item.color || item.sleeve || item.length) && <span> · </span>}
                    {item.color && <span className="capitalize">Color: {item.color}</span>}
                    {item.color && (item.sleeve || item.length) && <span> · </span>}
                    {(item.sleeve || item.length) && <span className="capitalize">{item.sleeve || item.length}</span>}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(item.id)}
                className="text-muted hover:text-bmr-black"
                aria-label="Remove item"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              {/* Quantity */}
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQty(item.id, item.qty - 1)}
                  disabled={item.qty <= 1}
                  className="px-3 py-2 hover:bg-border transition-colors disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm min-w-[50px] text-center">{item.qty}</span>
                <button
                  onClick={() => setQty(item.id, item.qty + 1)}
                  className="px-3 py-2 hover:bg-border transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Price */}
              <div className="font-medium">
                {formatPrice((item.price || item.priceAtAdd) * item.qty, currency)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}



