import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryMosaic } from '@/components/home/CategoryMosaic';
import { BestSellers } from '@/components/home/BestSellers';
import { PromoBand } from '@/components/home/PromoBand';
import { ReviewsCarousel } from '@/components/home/ReviewsCarousel';
import { ShemaghTabs } from '@/components/home/ShemaghTabs';
import { BrandStory } from '@/components/home/BrandStory';
import { IconRow } from '@/components/home/IconRow';
import type { HeroSlide, MosaicTile, ShemaghTab, Review, StoryBlock, IconItem } from '@/types';

export default function HomePage() {
  // Mock data - Replace with Firebase data once seeded
  const heroSlides: HeroSlide[] = [
    {
      type: 'image',
      src: '/placeholder.svg',
      titleEn: 'Luxury Thobes & Modest Fashion',
      titleAr: 'ثوب فاخر وأزياء محتشمة',
      subEn: 'Timeless elegance for every occasion',
      subAr: 'أناقة خالدة لكل مناسبة',
      ctaTextEn: 'Shop Now',
      ctaTextAr: 'تسوق الآن',
      href: '/shop',
    },
  ];

  const mosaicTiles: MosaicTile[] = [
    {
      titleEn: "Men's Thobes",
      titleAr: 'ثوب رجالي',
      href: '/category/thobes',
      image: '/placeholder.svg',
      span: { cols: 2, rows: 1 },
    },
    {
      titleEn: 'Shemaghs',
      titleAr: 'شماغ',
      href: '/category/shemaghs',
      image: '/placeholder.svg',
    },
    {
      titleEn: "Women's Abayas",
      titleAr: 'عباية نسائية',
      href: '/category/abayas',
      image: '/placeholder.svg',
    },
  ];

  const shemaghTabs: ShemaghTab[] = [
    {
      slug: 'yemeni',
      labelEn: 'Yemeni Shemagh Scarves',
      labelAr: 'شماغ يمني',
      categoryFilter: 'SHAAL',
      tagFilter: 'yemeni',
    },
    {
      slug: 'saudi',
      labelEn: 'Saudi Shemagh Scarves',
      labelAr: 'شماغ سعودي',
      categoryFilter: 'SHAAL',
      tagFilter: 'saudi',
    },
    {
      slug: 'kufis',
      labelEn: 'Egyptian Kufis',
      labelAr: 'كوفي مصري',
      categoryFilter: 'KUFI',
    },
  ];

  const reviews: Review[] = [
    {
      id: '1',
      productId: 'test',
      rating: 5,
      title: 'Excellent Quality',
      body: 'The fabric is superb and the fit is perfect. Highly recommend!',
      name: 'Ahmed K.',
      approved: true,
      pinnedHome: true,
      createdAt: new Date(),
    },
    {
      id: '2',
      productId: 'test',
      rating: 5,
      title: 'Beautiful Design',
      body: 'Elegant and comfortable. Will definitely purchase again.',
      name: 'Mohammed A.',
      approved: true,
      pinnedHome: true,
      createdAt: new Date(),
    },
    {
      id: '3',
      productId: 'test',
      rating: 5,
      title: 'Perfect for Weddings',
      body: 'Wore it to a wedding and received many compliments. Thank you BMR!',
      name: 'Omar S.',
      approved: true,
      pinnedHome: true,
      createdAt: new Date(),
    },
  ];

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

  const iconItems: IconItem[] = [
    {
      iconName: 'Truck',
      labelEn: 'Worldwide Delivery',
      labelAr: 'توصيل عالمي',
    },
    {
      iconName: 'RefreshCw',
      labelEn: '14-Day Exchange',
      labelAr: 'استبدال ١٤ يوم',
    },
    {
      iconName: 'Heart',
      labelEn: 'Made with Care',
      labelAr: 'صنع بعناية',
    },
  ];

  return (
    <>
      <HeroCarousel slides={heroSlides} locale="en" />

      <CategoryMosaic tiles={mosaicTiles} locale="en" />

      {/* Best Sellers - will be empty until products are added to Firebase */}
      <BestSellers products={[]} locale="en" />

      <PromoBand
        title="Men's & Kids Collection"
        subtitle="Match your loved one"
        imageLeft="/placeholder.svg"
        imageRight="/placeholder.svg"
        locale="en"
      />

      <ReviewsCarousel reviews={reviews} />

      <ShemaghTabs
        tabs={shemaghTabs}
        productsByTab={{}}
        locale="en"
      />

      <BrandStory storyBlocks={storyBlocks} locale="en" />

      <IconRow items={iconItems} locale="en" />
    </>
  );
}

