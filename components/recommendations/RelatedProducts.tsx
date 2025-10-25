'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecProductCard } from './ProductCard';

interface ProductLite { id: string; title: string; tags?: string[]; views?: number; slug?: string; image?: string; price: number; category: string; }

interface Props { product: ProductLite | any }

export function RelatedProducts({ product }: Props) {
  const [items, setItems] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, orderBy('views', 'desc'));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const currentTags = new Set((product.tags || product.tagIds || []).map((t: string) => String(t).toLowerCase()));
        const filtered = all.filter((p: any) => {
          if (p.id === product.id || p.slug === product.slug) return false;
          if ((p.category || p.categoryId || '').toLowerCase() !== (product.category || product.categoryId || '').toLowerCase()) return false;
          const ptags: string[] = (p.tags || p.tagIds || []).map((t: string) => String(t).toLowerCase());
          return ptags.some(t => currentTags.has(t));
        }).slice(0, 6);
        if (mounted) setItems(filtered);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (product?.category) {
      load().catch(async () => {
        // Fallback via admin API
        try {
          const res = await fetch('/api/admin/products');
        const json = await res.json();
        const all = (json?.products || []) as any[];
        const currentTags = new Set((product.tags || product.tagIds || []).map((t: string) => String(t).toLowerCase()));
          const filtered = all
            .filter((p: any) => p.id !== product.id && p.slug !== product.slug)
            .map((p: any) => ({ ...p, category: p.category || p.categoryId }))
            .filter((p: any) => String(p.category || '').toLowerCase() === String(product.category || product.categoryId || '').toLowerCase())
            .filter((p: any) => (p.tags || p.tagIds || []).map((t: string) => String(t).toLowerCase()).some((t: string) => currentTags.has(t)))
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 6);
          if (mounted) setItems(filtered);
        } catch {}
        if (mounted) setLoading(false);
      });
    }
    return () => { mounted = false; };
  }, [product?.id, product?.slug, product?.category, JSON.stringify(product?.tags || [])]);

  if (loading) return null;
  if (!items.length) return null;

  return (
    <section className="mt-16">
      <h3 className="font-display text-xl mb-4">Related Products</h3>
      <div className="grid grid-cols-2 sm:flex sm:flex-row sm:gap-4 overflow-x-auto sm:overflow-visible pb-2 gap-4">
        {items.map((p) => (
          <RecProductCard key={p.id} product={p} badge={p.views && p.views > 500 ? 'Trending' : null} />
        ))}
      </div>
    </section>
  );
}


