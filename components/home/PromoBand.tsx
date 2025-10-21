'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PromoBandProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  imageLeft: string;
  imageRight: string;
  locale?: string;
}

export function PromoBand({
  eyebrow = 'Luxury Omani Collection',
  title,
  subtitle = 'Match your loved one',
  ctaText = 'Shop Matching Sets',
  ctaHref = '/collections/matching',
  imageLeft,
  imageRight,
  locale = 'en',
}: PromoBandProps) {
  return (
    <section className="py-16 lg:py-24 bg-surface-3">
      <div className="container-wide">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Image (Wide) */}
          <div className="relative aspect-[16/9] lg:aspect-[3/2] overflow-hidden rounded-lg">
            <Image
              src={imageLeft}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Right Column */}
          <div className="flex flex-col justify-between gap-6">
            {/* Text Content */}
            <div className="bg-surface-2 rounded-lg p-8 lg:p-12 text-center flex flex-col justify-center">
              {eyebrow && (
                <p className="text-sm uppercase tracking-wideish text-bmr-muted mb-3">
                  {eyebrow}
                </p>
              )}
              <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
                {title}
              </h2>
              {subtitle && (
                <p className="text-lg text-bmr-muted mb-6">
                  {subtitle}
                </p>
              )}
              {ctaText && ctaHref && (
                <Link
                  href={ctaHref}
                  className="inline-flex items-center justify-center gap-2 btn-primary mx-auto"
                >
                  {ctaText}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Right Image (Portrait) */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
              <Image
                src={imageRight}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


