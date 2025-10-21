'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroSlide } from '@/types';
import { cn } from '@/lib/utils';

interface HeroCarouselProps {
  slides: HeroSlide[];
  locale?: string;
}

export function HeroCarousel({ slides, locale = 'en' }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isRtl = locale === 'ar';

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((current) => (current + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  if (!slides || slides.length === 0) return null;

  const slide = slides[currentSlide];
  const title = isRtl ? slide.titleAr : slide.titleEn;
  const sub = isRtl ? slide.subAr : slide.subEn;
  const ctaText = isRtl ? slide.ctaTextAr : slide.ctaTextEn;

  return (
    <section
      className="relative h-[88vh] min-h-[600px] max-h-[900px] overflow-hidden bg-bmr-ink"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Hero carousel"
    >
      {/* Slide Content */}
      <div className="absolute inset-0 transition-opacity duration-700">
        {slide.type === 'video' ? (
          <video
            className="w-full h-full object-cover"
            src={slide.src}
            poster={slide.poster}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <Image
            src={slide.src}
            alt={title}
            fill
            className="object-cover"
            priority={currentSlide === 0}
            sizes="100vw"
          />
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="container-wide">
          <div className={cn(
            "max-w-xl text-white",
            isRtl ? "mr-auto text-right" : "text-left"
          )}>
            {slide.eyebrow && (
              <p className="text-sm uppercase tracking-wideish mb-4 opacity-90">
                {slide.eyebrow}
              </p>
            )}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-tight mb-6">
              {title}
            </h1>
            {sub && (
              <p className="text-lg md:text-xl opacity-90 mb-8 leading-relaxed">
                {sub}
              </p>
            )}
            {ctaText && slide.href && (
              <Link
                href={slide.href}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-bmr-ink rounded-full text-sm font-medium uppercase tracking-wide hover:bg-surface-3 transition-all duration-200"
              >
                {ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-200"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-200"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentSlide
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}


