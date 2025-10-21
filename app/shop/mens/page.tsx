'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/products/ProductCard';
import { getAllProducts } from '@/lib/firebaseAdminStore';

export default function MensCollectionsPage() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    getAllProducts('MEN').then((all) => {
      const filtered = (all || []).filter((p: any) => (p.audience || 'MEN') === 'MEN');
      setProducts(filtered);
    });
  }, []);
  const mensCollections = [
    {
      id: 'omani',
      name: 'OMANI COLLECTION',
      href: '/category/omani',
      image: 'https://images.unsplash.com/photo-1583486932669-e4c9b0e10c46?w=800&h=1000&fit=crop'
    },
    {
      id: 'emirati',
      name: 'LUXURY LIGHTWEIGHT EMIRATI',
      href: '/category/emirati',
      image: 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800&h=1000&fit=crop'
    },
    {
      id: 'moroccan-gandouras',
      name: 'MOROCCAN GANDOURAS',
      href: '/category/gandoura',
      image: 'https://images.unsplash.com/photo-1609840114035-3c981731af44?w=800&h=1000&fit=crop'
    },
    {
      id: 'moroccan-djellabas',
      name: 'ROYAL HOODED MOROCCAN DJELLABAS',
      href: '/category/luxury-djellaba',
      image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&h=1000&fit=crop'
    },
    {
      id: 'hooded-djellabas',
      name: 'HOODED DJELLABAS',
      href: '/category/hooded-djellabas',
      image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=1000&fit=crop'
    },
    {
      id: 'signature',
      name: 'SIGNATURE COLLECTION',
      href: '/category/signature',
      image: 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800&h=1000&fit=crop&sat=-50'
    },
    {
      id: 'matching',
      name: 'ALL MATCHING THOBES',
      href: '/category/matching-sets',
      image: 'https://images.unsplash.com/photo-1583486932669-e4c9b0e10c46?w=800&h=1000&fit=crop&sat=-20'
    },
    {
      id: 'best-sellers',
      name: 'BEST SELLERS',
      href: '/shop/best-sellers',
      image: 'https://images.unsplash.com/photo-1609840114035-3c981731af44?w=800&h=1000&fit=crop&sat=-30'
    },
  ];

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[400px] bg-gray-200">
        <img
          src="https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=1600&h=600&fit=crop"
          alt="Men's Collections"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <Container className="relative h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="font-display text-5xl lg:text-6xl mb-4">MEN'S COLLECTIONS</h1>
            <p className="text-lg">Discover our premium range of traditional attire</p>
          </div>
        </Container>
      </section>

      {/* Products Grid (Men) */}
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

      {/* Shop All CTA */}
      <section className="py-12 bg-gray-50">
        <Container>
          <div className="text-center">
            <Link
              href="/shop"
              className="inline-block px-12 py-4 border-2 border-bmr-black text-bmr-black text-sm uppercase tracking-wider hover:bg-bmr-black hover:text-white transition-colors"
            >
              SHOP ALL
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}





