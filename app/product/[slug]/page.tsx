'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { ProductGallery } from '@/components/products/ProductGallery';
import { SizeSelect } from '@/components/products/SizeSelect';
import { ColorSelect } from '@/components/products/ColorSelect';
import { SleeveSelect } from '@/components/products/SleeveSelect';
import { QtyStepper } from '@/components/products/QtyStepper';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { PdpAccordions } from '@/components/products/PdpAccordions';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProductBySlug, useProductsByCategory } from '@/hooks/useData';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';
import { logProductView, logAddToCart } from '@/lib/analytics';
import { FrequentlyBoughtTogether } from '@/components/recommendations/FrequentlyBoughtTogether';
import { CustomersAlsoBought } from '@/components/recommendations/CustomersAlsoBought';
import { RelatedProducts } from '@/components/recommendations/RelatedProducts';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { product, isLoading } = useProductBySlug(slug);
  const { products: relatedProducts } = useProductsByCategory(product?.id || null);
  const { currency } = useLocale();
  const addToCart = useCartStore((state) => state.add);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSleeve, setSelectedSleeve] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  // Compute gallery images (prefer product.images from Admin) - MUST be before early returns
  const allGalleryImages: string[] = useMemo(() => {
    const imgs = (product as any)?.images as string[] | undefined;
    if (imgs && Array.isArray(imgs) && imgs.length > 0) return imgs;
    return product?.defaultImage?.url ? [product.defaultImage.url] : [];
  }, [product]);

  // Get images for selected color from colorImageMappings
  const galleryImages: string[] = useMemo(() => {
    if (!selectedColor || !product) return allGalleryImages;
    
    const colorMappings = (product as any)?.colorImageMappings as Array<{ color: string; imageUrls: string[] }> | undefined;
    
    if (colorMappings && Array.isArray(colorMappings)) {
      const mapping = colorMappings.find(m => m.color === selectedColor);
      if (mapping && mapping.imageUrls && mapping.imageUrls.length > 0) {
        return mapping.imageUrls;
      }
    }
    
    // If no mapping found, return all images
    return allGalleryImages;
  }, [selectedColor, product, allGalleryImages]);

  // Filter related products (same category, exclude current) - MUST be before early returns
  const recommendations = useMemo(() => {
    return relatedProducts
      ? relatedProducts.filter((p) => p.id !== product?.id).slice(0, 8)
      : [];
  }, [relatedProducts, product]);

  // Derive safe totals to avoid undefined access when counts is missing
  const totalStock = product?.counts?.totalStock ?? (product as any)?.stock ?? 0;
  const reviewCount = product?.counts?.reviewCount ?? 0;
  const ratingAvg = product?.counts?.ratingAvg ?? 0;

  // Log product view when product loads
  if (product && !isLoading) {
    logProductView(product.id, product.titleEn, product.category);
  }

  const handleAddToCart = () => {
    if (!product) return;

    // Validation
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Please select a color');
      return;
    }

    addToCart({
      variantId: product.id, // Would be variant ID in real app
      productId: product.id,
      title: product.titleEn,
      sku: product.sku,
      priceAtAdd: product.price || product.basePrice,
      qty,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      length: selectedSleeve || undefined,
      imageUrl: product.defaultImage?.url,
    });

    logAddToCart(product.id, product.titleEn, product.price || product.basePrice, qty);
    alert('Added to cart!');
  };

  if (isLoading) {
    return (
      <Container className="py-12">
        <div className="text-center text-muted">Loading product...</div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-display mb-4">Product not found</h1>
          <a href="/shop" className="text-muted hover:text-bmr-black underline">
            Continue shopping
          </a>
        </div>
      </Container>
    );
  }

  // Accordion content
  const accordionItems = [
    {
      title: 'Product Details',
      content: product.descriptionEn || product.subtitleEn || '',
      defaultOpen: true,
    },
  ];

  if (product.fabric) {
    accordionItems.push({
      title: 'Fabric & Care',
      content: product.fabric,
      defaultOpen: false,
    });
  }

  if (product.care) {
    accordionItems.push({
      title: 'Care Instructions',
      content: product.care,
      defaultOpen: false,
    });
  }

  accordionItems.push({
    title: 'Shipping & Returns',
    content: '<p>Free shipping on orders over $99. Easy returns within 14 days.</p>',
    defaultOpen: false,
  });

  return (
    <>
      <div className="bg-surface-2">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumbs
            items={[
              { label: 'Shop', href: '/shop' },
              { label: product.titleEn, href: `/product/${product.slug}` },
            ]}
          />

          <div className="mt-8 lg:mt-12 lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            {/* Gallery */}
            <div>
              <ProductGallery images={galleryImages} alt={product.titleEn} />
            </div>

            {/* Product Info */}
            <div className="mt-8 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
              {product.featured && (
                <div className="flex gap-2 mb-6">
                  <span className="px-4 py-1.5 bg-bmr-ink text-surface-2 text-xs uppercase tracking-wideish rounded-full">
                    Featured
                  </span>
                </div>
              )}

              <h1 className="font-display text-3xl lg:text-4xl leading-tight mb-2">{product.titleEn}</h1>

              {/* Reviews summary */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-bmr-muted mb-6">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const filled = ratingAvg >= i + 1;
                      return (
                        <svg key={i} className={`w-4 h-4 ${filled ? 'text-bmr-ink' : 'text-line'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118L10.95 13.9a1 1 0 00-1.176 0l-2.437 1.772c-.783.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.702 8.72c-.783-.57-.38-1.81.588-1.81h3.463a1 1 0 00.95-.69l1.07-3.292z"/>
                        </svg>
                      );
                    })}
                  </div>
                  <span>({reviewCount})</span>
                </div>
              )}

              {product.subtitleEn && (
                <p className="text-lg text-bmr-muted leading-relaxed mb-8">{product.subtitleEn}</p>
              )}

              <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-line">
                <span className="font-display text-3xl">
                  {formatPrice(product.price || product.basePrice, currency)}
                </span>
              </div>

              {totalStock === 0 && (
                <div className="mb-8 p-6 bg-surface-3 rounded-lg border border-line">
                  <p className="text-sm font-medium text-bmr-ink">Currently out of stock</p>
                  <p className="text-sm text-bmr-muted mt-1">Sign up for restock notifications</p>
                </div>
              )}

              {totalStock > 0 && totalStock <= 5 && (
                <div className="mb-8 p-6 bg-surface-3 rounded-lg border border-line">
                  <p className="text-sm font-medium text-bmr-acc-red">Only {totalStock} left in stock</p>
                  <p className="text-sm text-bmr-muted mt-1">Order soon to avoid missing out</p>
                </div>
              )}

              <div className="space-y-8">
                {product.sizes && product.sizes.length > 0 && (
                  <SizeSelect
                    sizes={product.sizes}
                    selected={selectedSize}
                    onChange={setSelectedSize}
                  />
                )}

                {product.colors && product.colors.length > 0 && (
                  <ColorSelect
                    colors={product.colors}
                    selected={selectedColor}
                    onChange={setSelectedColor}
                  />
                )}

                {product.sleeve && (product.sleeve === 'short' || product.sleeve === 'long') && (
                  <SleeveSelect
                    sleeves={[product.sleeve as 'short' | 'long']}
                    selected={selectedSleeve}
                    onChange={setSelectedSleeve}
                  />
                )}

                <div className="flex items-center gap-4">
                  <QtyStepper value={qty} onChange={setQty} max={totalStock} />
                  <div className="flex-1">
                    <AddToCartButton
                      onClick={handleAddToCart}
                      disabled={totalStock === 0}
                    />
                  </div>
                </div>

                {/* Utility links */}
                <div className="flex items-center gap-4 text-sm text-bmr-muted">
                  <a href="/size-guide" className="underline hover:text-bmr-ink">What's my size?</a>
                  {totalStock === 0 && (
                    <button type="button" className="px-3 py-1.5 border border-line rounded hover:bg-surface-3">Notify me when available</button>
                  )}
                </div>
              </div>

              <div className="mt-12">
                <PdpAccordions items={accordionItems} />
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="border-t border-line bg-surface-1 py-16 lg:py-24">
          <div className="container-wide">
            <FrequentlyBoughtTogether product={product} />
            <CustomersAlsoBought product={product} />
            <RelatedProducts product={product} />
          </div>
        </div>
      </div>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.titleEn,
            image: product.defaultImage?.url,
            description: product.subtitleEn || product.titleEn,
            offers: {
              '@type': 'Offer',
              price: (product.price || product.basePrice) / 100,
              priceCurrency: currency,
              availability:
                totalStock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            },
          }),
        }}
      />
    </>
  );
}
