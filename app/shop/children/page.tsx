'use client';

import Link from 'next/link';
import { Container } from '@/components/layout/Container';

export default function ChildrenCollectionsPage() {
  const childrenCollections = [
    {
      id: 'toddlers',
      name: 'TODDLERS',
      href: '/category/toddlers',
    },
    {
      id: 'boys-omani',
      name: "BOY'S OMANI",
      href: '/category/boys-omani',
    },
    {
      id: 'gandoura',
      name: 'GANDOURA',
      href: '/category/children-gandoura',
    },
    {
      id: 'djellaba',
      name: 'DJELLABA',
      href: '/category/children-djellaba',
    },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {childrenCollections.map((collection) => (
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




