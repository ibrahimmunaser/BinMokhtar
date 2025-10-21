import { Metadata } from 'next';
import { Product, Review } from '@/types';

const SITE_URL = process.env.SITE_URL || 'https://binmukhtarretail.com';
const SITE_NAME = 'Bin Mukhtar Retail';
const SITE_DESCRIPTION = 'Luxury thobes, shemaghs, and kufis — Timeless modest fashion for men, women, and children.';

/**
 * Default SEO metadata
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['thobes', 'thobe', 'shemagh', 'kufi', 'modest fashion', 'islamic clothing', 'mens thobes'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_SA'],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

/**
 * Generate metadata for product pages
 */
export function generateProductMetadata(
  product: Product,
  locale: string = 'en'
): Metadata {
  const title = locale === 'ar' ? product.titleAr : product.titleEn;
  const description = locale === 'ar' 
    ? product.descriptionAr || product.subtitleAr 
    : product.descriptionEn || product.subtitleEn;
  
  const canonical = product.seo?.canonical || `${SITE_URL}/product/${product.slug}`;
  
  return {
    title: product.seo?.[locale === 'ar' ? 'titleAr' : 'titleEn'] || title,
    description: product.seo?.[locale === 'ar' ? 'descriptionAr' : 'descriptionEn'] || description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/product/${product.slug}`,
        ar: `${SITE_URL}/ar/product/${product.slug}`,
      },
    },
    openGraph: {
      type: 'product',
      url: canonical,
      title,
      description,
      images: product.defaultImage ? [
        {
          url: product.defaultImage.url,
          width: product.defaultImage.w,
          height: product.defaultImage.h,
          alt: locale === 'ar' ? product.defaultImage.altAr : product.defaultImage.altEn,
        },
      ] : [],
    },
  };
}

/**
 * Generate JSON-LD structured data for products
 */
export function generateProductJsonLd(product: Product, reviews?: Review[]) {
  const aggregateRating = product.counts.reviewCount > 0 ? {
    '@type': 'AggregateRating',
    ratingValue: product.counts.ratingAvg,
    reviewCount: product.counts.reviewCount,
  } : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.titleEn,
    description: product.descriptionEn,
    image: product.defaultImage?.url,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: product.currency,
      price: (product.basePrice / 100).toFixed(2),
      availability: product.counts.totalStock > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    },
    aggregateRating,
  };
}

/**
 * Generate JSON-LD breadcrumb list
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

/**
 * Generate JSON-LD organization
 */
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      // Add social media URLs
    ],
  };
}


