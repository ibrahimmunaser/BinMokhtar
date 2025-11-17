'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecProductCard } from './ProductCard';

interface ProductLite {
  id: string;
  title: string;
  price: number; // cents
  image?: string;
  category: string;
  orders?: number;
  slug?: string;
}

interface Props { product: ProductLite | any }

export function FrequentlyBoughtTogether({ product }: Props) {
  const [items, setItems] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const productsCol = collection(db, 'products');
        // same category, exclude current
        const q = query(
          productsCol,
          where('category', '==', (product.category || product.categoryId)),
          orderBy('orders', 'desc')
        );
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const filtered = all
          .map((p: any) => ({ ...p, category: p.category || p.categoryId }))
          .filter((p: any) => (p.id !== product.id && p.slug !== product.slug));
        const top = filtered.slice(0, 3);
        if (isMounted) setItems(top);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (product?.category || product?.categoryId) {
      load().catch(async () => {
        // Fallback: use admin API then filter/sort client-side
        try {
          const res = await fetch('/api/admin/products');
          const json = await res.json();
          const all = (json?.products || []) as any[];
          const prodCat = (product.category || product.categoryId || '').toLowerCase();
          const filtered = all
            .map((p: any) => ({ ...p, category: p.category || p.categoryId }))
            .filter((p) => (String(p.category || '').toLowerCase() === prodCat) && p.id !== product.id && p.slug !== product.slug)
            .sort((a, b) => (b.orders || 0) - (a.orders || 0))
            .slice(0, 3);
          if (isMounted) setItems(filtered);
        } catch {}
        if (isMounted) setLoading(false);
      });
    }
    return () => { isMounted = false; };
  }, [product?.id, product?.slug, product?.category, product?.categoryId]);

  const totalCents = useMemo(() => {
    const base = typeof product.price === 'number' ? product.price : 0;
    return [base, ...items.map(i => i.price || 0)].reduce((a, b) => a + b, 0);
  }, [items, product]);

  if (loading) return null;
  if (!items.length) return null;

  return (
    <section className="mt-16">
      <h3 className="font-display text-xl mb-4">Frequently Bought Together</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        <RecProductCard product={product} />
        {items.map((p) => (
          <RecProductCard key={p.id} product={p} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm">Total: <span className="font-medium">${(totalCents / 100).toFixed(2)}</span></p>
        <button
          type="button"
          onClick={() => {
            console.log('Bundle add to cart:', { main: product, items });
            if (typeof window !== 'undefined') alert('Bundle added to cart!');
          }}
          className="px-4 py-2 bg-bmr-ink text-surface-2 rounded hover:bg-bmr-fg"
        >
          Add all to cart
        </button>
      </div>
    </section>
  );
}


