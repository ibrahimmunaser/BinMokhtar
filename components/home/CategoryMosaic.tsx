'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MosaicTile } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryMosaicProps {
  tiles: MosaicTile[];
}

export function CategoryMosaic({ tiles }: CategoryMosaicProps) {
  if (!tiles || tiles.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-surface-1">
      <div className="container-wide">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tiles.map((tile, index) => {
            const title = tile.titleEn;

            return (
              <Link
                key={index}
                href={tile.href}
                className="group relative overflow-hidden bg-bmr-stone rounded-lg h-[250px] md:h-[300px]"
              >
                {/* Image */}
                <Image
                  src={tile.image}
                  alt={title}
                  fill
                  priority={index < 3}
                  loading={index < 3 ? undefined : 'lazy'}
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex items-end justify-center text-center p-6 pb-8">
                  <div className="w-full">
                    <h3 className="font-display text-2xl md:text-3xl lg:text-5xl font-medium text-white mb-3">
                      {title}
                    </h3>
                    <span className="inline-flex items-center justify-center px-6 py-2 bg-white text-bmr-ink rounded-full text-xs font-medium uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      View Products
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}








