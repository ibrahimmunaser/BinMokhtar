import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import type { Category } from '@/types';

interface FeaturedCategoriesProps {
  categories: Category[];
}

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  if (!categories.length) return null;

  return (
    <section className="py-16 lg:py-24">
      <Container>
        <h2 className="font-display text-3xl lg:text-4xl text-center mb-12">
          Shop by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.slice(0, 3).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group relative aspect-[3/4] overflow-hidden bg-border"
            >
              {category.heroImage && (
                <Image
                  src={category.heroImage}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-bmr-black/20 group-hover:bg-bmr-black/40 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-end p-8">
                <h3 className="font-display text-2xl lg:text-3xl text-bmr-white">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}









