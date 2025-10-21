'use client';

import Link from 'next/link';
import { Container } from '@/components/layout/Container';

export default function WomensCollectionsPage() {
  const womensCollections = [
    {
      id: 'abayas',
      name: 'ABAYAS',
      href: '/category/abayas',
      image: 'https://images.unsplash.com/photo-1583486932669-e4c9b0e10c46?w=800&h=1000&fit=crop'
    },
    {
      id: 'hijabs',
      name: 'HIJABS',
      href: '/category/hijabs',
      image: 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800&h=1000&fit=crop'
    },
  ];

  return (
    <>
      <section className="relative h-[400px] bg-gray-200">
        <div className="absolute inset-0 bg-gray-300" />
        <Container className="relative h-full flex items-center justify-center">
          <div className="text-center text-bmr-black">
            <h1 className="font-display text-5xl lg:text-6xl mb-4">WOMEN'S COLLECTIONS</h1>
            <p className="text-lg">Elegant and modest attire</p>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {womensCollections.map((collection) => (
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
    </>
  );
}




