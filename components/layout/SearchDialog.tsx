'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { useProducts } from '@/hooks/useData';
import { formatPrice } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const { products } = useProducts();
  const { currency } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredProducts =
    query.length > 1
      ? products?.filter(
          (p) =>
            p.titleEn.toLowerCase().includes(query.toLowerCase()) ||
            p.subtitleEn?.toLowerCase().includes(query.toLowerCase())
        ) || []
      : [];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-bmr-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-x-0 top-0 z-50 bg-bmr-white border-b border-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-6">
            <Search className="w-5 h-5 text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="flex-1 text-lg outline-none bg-transparent"
            />
            <button
              onClick={onClose}
              className="text-bmr-black hover:text-muted"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {query.length > 1 && (
            <div className="pb-6 max-h-[60vh] overflow-y-auto">
              {filteredProducts.length > 0 ? (
                <div className="space-y-2">
                  {filteredProducts.slice(0, 6).map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 p-3 hover:bg-border transition-colors"
                    >
                      {product.defaultImage && (
                        <div className="w-16 h-20 bg-border flex-shrink-0 relative">
                          <Image
                            src={product.defaultImage.url}
                            alt={product.titleEn}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-display text-sm">{product.titleEn}</div>
                        {product.subtitleEn && (
                          <div className="text-xs text-muted">{product.subtitleEn}</div>
                        )}
                        <div className="text-sm font-medium mt-1">
                          {formatPrice(product.price || product.basePrice, currency)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted">No products found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}




