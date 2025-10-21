'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/products/ProductCard';
import { getAllProducts } from '@/lib/firebaseAdminStore';

export default function ChildrenCollectionsPage() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    getAllProducts('CHILDREN').then((all) => {
      const filtered = (all || []).filter((p: any) => (p.audience || 'MEN') === 'CHILDREN');
      setProducts(filtered);
    });
  }, []);

  return (
    <>
      <section className="relative h-[400px] bg-gray-200">
        <div className="absolute inset-0 bg-gray-300" />
        <Container className="relative h-full flex items-center justify-center">
          <div className="text-center text-bmr-black">
            <h1 className="font-display text-5xl lg:text-6xl mb-4">CHILDREN'S COLLECTIONS</h1>
            <p className="text-lg">Traditional attire for little ones</p>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                variant={{
                  id: product.id,
                  productId: product.id,
                  productSlug: product.slug,
                  productTitleEn: product.titleEn || product.name,
                  productTitleAr: product.titleAr || product.name,
                  category: product.category || 'THOBE',
                  sku: product.id,
                  size: product.sizes?.[0],
                  price: product.price || product.basePrice,
                  compareAt: undefined,
                  stock: product.counts?.totalStock ?? product.stock ?? 0,
                  active: true,
                  imageUrl: product.defaultImage?.url || product.thumbnail,
                  createdAt: product.createdAt,
                  updatedAt: product.updatedAt,
                }}
                showSoldOut
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}





