'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square bg-surface-3 flex items-center justify-center rounded">
        <span className="text-muted">No image</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Thumbnails - Vertical on desktop, horizontal on mobile */}
      {images.length > 1 && (
        <div className="order-2 lg:order-1 overflow-x-auto lg:overflow-visible">
          <div className="flex lg:flex-col gap-3 pb-2 lg:pb-0">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`
                  flex-shrink-0 w-20 h-20 relative rounded overflow-hidden bg-surface-3
                  border-2 transition-all
                  ${selectedIndex === index ? 'border-bmr-ink ring-1 ring-bmr-ink' : 'border-line hover:border-bmr-muted'}
                `}
              >
                <Image
                  src={image}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Image */}
      <div className="order-1 lg:order-2 flex-1">
        <div className="aspect-square bg-surface-3 relative overflow-hidden rounded">
          <Image
            src={images[selectedIndex]}
            alt={`${alt} - Image ${selectedIndex + 1}`}
            fill
            className="object-contain transition-transform hover:scale-105 duration-500"
            priority={selectedIndex === 0}
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>
      </div>
    </div>
  );
}
