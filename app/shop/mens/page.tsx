'use client';

import Link from 'next/link';
import { Container } from '@/components/layout/Container';

export default function MensCollectionsPage() {
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

      {/* Collections Grid */}
      <section className="py-16 lg:py-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mensCollections.map((collection) => (
              <Link
                key={collection.id}
                href={collection.href}
                className="group relative aspect-[3/4] overflow-hidden bg-gray-100"
              >
                <div className="absolute inset-0 bg-gray-800"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white font-medium text-sm uppercase tracking-wider text-center px-4">
                    {collection.name}
                  </h3>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </Link>
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




