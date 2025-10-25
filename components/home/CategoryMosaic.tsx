'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MosaicTile } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryMosaicProps {
  tiles: MosaicTile[];
  locale?: string;
}

export function CategoryMosaic({ tiles, locale = 'en' }: CategoryMosaicProps) {
  const isRtl = locale === 'ar';

  if (!tiles || tiles.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-surface-1">
      <div className="container-wide">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[250px] md:auto-rows-[300px]">
          {tiles.map((tile, index) => {
            const title = isRtl ? tile.titleAr : tile.titleEn;
            const colSpan = tile.span?.cols || 1;
            const rowSpan = tile.span?.rows || 1;

            return (
              <Link
                key={index}
                href={tile.href}
                className={cn(
                  "group relative overflow-hidden bg-bmr-stone rounded-lg",
                  colSpan === 2 && "col-span-2",
                  rowSpan === 2 && "row-span-2"
                )}
              >
                {/* Image */}
                <Image
                  src={tile.image}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes={colSpan === 2 ? "66vw" : "33vw"}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <h3 className="font-display text-2xl md:text-3xl font-medium text-white mb-4">
                    {title}
                  </h3>
                  <span className="inline-flex items-center justify-center px-6 py-2 bg-white text-bmr-ink rounded-full text-sm font-medium uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    View Products
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}







