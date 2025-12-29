"use client";
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { useEffect, useState } from 'react';
import { CategoryMosaic } from '@/components/home/CategoryMosaic';
import { BestSellers } from '@/components/home/BestSellers';
import { ReviewsCarousel } from '@/components/home/ReviewsCarousel';
import { BrandStory } from '@/components/home/BrandStory';
import { FIREBASE_IMAGES } from '@/lib/firebase-images';
import type { HeroSlide, MosaicTile, Review, StoryBlock } from '@/types';

export default function HomePage() {
  // Build hero slides dynamically from /public/images (hero*.{png,jpg,jpeg,webp}) and /public/videos (hero*.{mp4,webm,ogg})
  // Initialize with placeholder to prevent empty hero on first render
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([{
    type: 'image',
    src: FIREBASE_IMAGES.HOME_MENS_THOBE,
    titleEn: 'Luxury Thobes & Modest Fashion',
    titleAr: 'ثوب فاخر وأزياء محتشمة',
    subEn: 'Timeless elegance for every occasion',
    subAr: 'أناقة خالدة لكل مناسبة',
    ctaTextEn: 'Shop Now',
    ctaTextAr: 'تسوق الآن',
    href: '/shop'
  }]);

  // Load 5-star reviews with comments for homepage
  const [reviews, setReviews] = useState<Review[]>([]);
  // Start with empty array - will load from API
  const [mosaicTiles, setMosaicTiles] = useState<MosaicTile[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    async function loadHeroMedia() {
      try {
        const res = await fetch('/api/hero-media', { 
          next: { revalidate: 600 } // Cache for 10 minutes
        });
        const json = await res.json();
        const slides: any[] = json?.slides || [];
        const mapped: HeroSlide[] = slides.map((s: any, idx: number) => ({
          type: s.type,
          src: s.src,
          poster: s.poster,
          titleEn: idx === 0 ? 'Luxury Thobes & Modest Fashion' : 'Crafted With Care',
          titleAr: idx === 0 ? 'ثوب فاخر وأزياء محتشمة' : 'مصنوع بعناية',
          subEn: idx === 0 ? 'Timeless elegance for every occasion' : 'Premium fabrics. Exceptional tailoring.',
          subAr: idx === 0 ? 'أناقة خالدة لكل مناسبة' : 'أقمشة فاخرة وخياطة مميزة.',
          ctaTextEn: 'Shop Now',
          ctaTextAr: 'تسوق الآن',
          href: '/shop',
        }));
        if (mounted && mapped.length > 0) {
          setHeroSlides(mapped);
        }
      } catch (error) {
        console.error('Error loading hero media:', error);
        // Keep the initial placeholder slide on error
      }
    }

    async function loadReviews() {
      try {
        const res = await fetch('/api/reviews?homepage=true&limit=10', { 
          next: { revalidate: 300 } // Cache for 5 minutes
        });
        const json = await res.json();
        if (mounted && json.success && json.reviews?.length > 0) {
          setReviews(json.reviews);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    }

    async function loadCategories() {
      try {
        const res = await fetch('/api/homepage-categories', { 
          next: { revalidate: 300 } // Cache for 5 minutes
        });
        const json = await res.json();
        if (mounted && json.success && json.categories?.length > 0) {
          setMosaicTiles(json.categories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        if (mounted) {
          setIsCategoriesLoading(false);
        }
      }
    }

    loadHeroMedia();
    loadReviews();
    loadCategories();
    return () => { mounted = false; };
  }, []);

  const storyBlocks: StoryBlock[] = [
    {
      titleEn: 'Our Story',
      titleAr: 'قصتنا',
      bodyEn:
        'Bin Mukhtar Retail brings you the finest luxury thobes, combining traditional craftsmanship with contemporary design. Each piece is carefully crafted to ensure the highest quality and comfort.',
      bodyAr:
        'يقدم لكم بن مختار ريتيل أفخر الثياب الفاخرة، حيث نجمع بين الحرفية التقليدية والتصميم المعاصر. كل قطعة مصنوعة بعناية لضمان أعلى جودة وراحة.',
    },
    {
      bodyEn:
        'We source only the finest fabrics and work with skilled artisans who understand the importance of detail and tradition. Our commitment to excellence ensures that every garment meets the highest standards of quality and elegance.',
      bodyAr:
        'نحصل فقط على أفضل الأقمشة ونعمل مع حرفيين ماهرين يفهمون أهمية التفاصيل والتقاليد. التزامنا بالتميز يضمن أن كل ثوب يلبي أعلى معايير الجودة والأناقة.',
    },
  ];

  return (
    <>
      <HeroCarousel slides={heroSlides} />

      {!isCategoriesLoading && <CategoryMosaic tiles={mosaicTiles} />}

      {/* Best Sellers - will be empty until products are added to Firebase */}
      <BestSellers products={[]} />

      <ReviewsCarousel reviews={reviews} />

      <BrandStory storyBlocks={storyBlocks} />
    </>
  );
}

