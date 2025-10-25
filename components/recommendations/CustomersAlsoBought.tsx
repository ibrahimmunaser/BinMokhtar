'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecProductCard } from './ProductCard';

interface ProductLite { id: string; title: string; tags?: string[]; orders?: number; slug?: string; image?: string; price: number; category: string; }

interface Props { product: ProductLite | any }

export function CustomersAlsoBought({ product }: Props) {
  const [items, setItems] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, orderBy('orders', 'desc'));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const currentTags = new Set((product.tags || product.tagIds || []).map((t: string) => String(t).toLowerCase()));
        const matches = all.filter((p: any) => {
          if (p.id === product.id || p.slug === product.slug) return false;
          const ptags: string[] = (p.tags || []).map((t: string) => t.toLowerCase());
          return ptags.some(t => currentTags.has(t));
        }).slice(0, 6);
        if (mounted) setItems(matches);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load().catch(async () => {
      // Fallback via admin API
      try {
        const res = await fetch('/api/admin/products');
        const json = await res.json();
        const all = (json?.products || []) as any[];
        const currentTags = new Set((product.tags || product.tagIds || []).map((t: string) => String(t).toLowerCase()));
        const matches = all
          .filter((p: any) => p.id !== product.id && p.slug !== product.slug)
          .filter((p: any) => (p.tags || []).map((t: string) => t.toLowerCase()).some((t: string) => currentTags.has(t)))
          .sort((a, b) => (b.orders || 0) - (a.orders || 0))
          .slice(0, 6);
        if (mounted) setItems(matches);
      } catch {}
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [product?.id, product?.slug, JSON.stringify(product?.tags || [])]);

  if (loading) return null;
  if (!items.length) return null;

  return (
    <section className="mt-16">
      <h3 className="font-display text-xl mb-4">Customers Also Bought</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((p) => (
          <RecProductCard key={p.id} product={p} badge={p.orders && p.orders > 100 ? 'Popular' : null} />
        ))}
      </div>
    </section>
  );
}


