'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { ProductGallery } from '@/components/products/ProductGallery';
import { SizeSelect } from '@/components/products/SizeSelect';
import { ColorSelect } from '@/components/products/ColorSelect';
import { QtyStepper } from '@/components/products/QtyStepper';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProductBySlug, useProductsByCategory } from '@/hooks/useData';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/contexts/ToastContext';
import { logProductView, logAddToCart } from '@/lib/analytics';
import { Check, Truck, Shield } from 'lucide-react';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { product, isLoading } = useProductBySlug(slug);
  const { products: relatedProducts } = useProductsByCategory(product?.id || null);
  const { currency } = useLocale();
  const addToCart = useCartStore((state) => state.add);
  const { showToast } = useToast();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>('details');

  // Compute all gallery images
  const allGalleryImages: string[] = useMemo(() => {
    const imgs = (product as any)?.images as string[] | undefined;
    if (imgs && Array.isArray(imgs) && imgs.length > 0) return imgs;
    return product?.defaultImage?.url ? [product.defaultImage.url] : [];
  }, [product]);

  // Get images for selected color, but always show all images
  const galleryImages: string[] = useMemo(() => {
    if (!selectedColor || !product) return allGalleryImages;
    
    const colorMappings = (product as any)?.colorImageMappings as Array<{ color: string; imageUrls: string[] }> | undefined;
    
    if (colorMappings && Array.isArray(colorMappings)) {
      const mapping = colorMappings.find(m => m.color === selectedColor);
      if (mapping && mapping.imageUrls && mapping.imageUrls.length > 0) {
        // Put color-specific images first, then add remaining images
        const colorImages = mapping.imageUrls;
        const remainingImages = allGalleryImages.filter(img => !colorImages.includes(img));
        return [...colorImages, ...remainingImages];
      }
    }
    
    return allGalleryImages;
  }, [selectedColor, product, allGalleryImages]);

  // Filter related products
  const recommendations = useMemo(() => {
    return relatedProducts
      ? relatedProducts.filter((p) => p.id !== product?.id).slice(0, 4)
      : [];
  }, [relatedProducts, product]);

  const totalStock = product?.counts?.totalStock ?? (product as any)?.stock ?? 0;
  const reviewCount = product?.counts?.reviewCount ?? 0;
  const ratingAvg = product?.counts?.ratingAvg ?? 0;

  // Log product view
  if (product && !isLoading) {
    logProductView(product.id, product.titleEn, product.category);
  }

  const handleAddToCart = () => {
    if (!product) return;

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Please select a color');
      return;
    }

    const itemTitle = product.titleEn || (product as any).name;
    const itemImage = product.primaryImageUrl || (product as any).thumbnail || galleryImages[0];
    
    addToCart({
      variantId: product.id,
      productId: product.id,
      title: itemTitle,
      name: itemTitle, // alias for compatibility
      sku: product.sku,
      priceAtAdd: product.price || product.basePrice,
      price: product.price || product.basePrice, // alias for compatibility
      qty,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      imageUrl: itemImage,
      image: itemImage, // alias for compatibility
      slug: product.slug,
    });

    logAddToCart(product.id, product.titleEn, product.price || product.basePrice, qty);
    
    // Show toast notification
    showToast({
      type: 'success',
      message: 'Added to cart!',
      description: `${qty} × ${product.titleEn || (product as any).name}${selectedSize ? ` (${selectedSize})` : ''}${selectedColor ? ` • ${selectedColor}` : ''}`,
      imageUrl: product.primaryImageUrl || (product as any).thumbnail || galleryImages[0],
      actionLabel: 'View Cart',
      onAction: () => {
        window.location.href = '/cart';
      },
      duration: 5000,
    });
  };

  if (isLoading) {
    return (
      <Container className="py-12">
        <div className="text-center text-muted">Loading...</div>
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

  const accordionContent = {
    details: product.descriptionEn || product.subtitleEn || `
      <ul class="space-y-2">
        <li>• Premium quality fabric</li>
        <li>• Comfortable fit for all-day wear</li>
        <li>• Easy care and maintenance</li>
      </ul>
    `,
    shipping: `
      <ul class="space-y-2">
        <li>• <strong>Free shipping</strong> on orders over $89</li>
        <li>• <strong>30-day returns</strong> – hassle-free</li>
        <li>• Orders typically ship within 1-2 business days</li>
        <li>• Track your order from checkout to delivery</li>
      </ul>
    `,
  };

  return (
    <>
      <div className="bg-surface-1 min-h-screen">
        {/* Breadcrumbs */}
        <div className="border-b border-line bg-surface-2">
          <Container className="py-3">
            <Breadcrumbs
              items={[
                { label: 'Shop', href: '/shop' },
                { label: product.titleEn, href: `/product/${product.slug}` },
              ]}
            />
          </Container>
        </div>

        {/* Main Product Section */}
        <Container className="py-8 lg:py-12">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-16">
            {/* LEFT: Gallery */}
            <div>
              <ProductGallery images={galleryImages} alt={product.titleEn} />
            </div>

            {/* RIGHT: Summary - Sticky on desktop */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {/* Title & Price */}
              <h1 className="font-display text-3xl lg:text-4xl leading-tight mb-4">
                {product.titleEn}
              </h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-display text-3xl">
                  {formatPrice(product.price || product.basePrice, currency)}
                </span>
              </div>

              {/* Reviews (if available) */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-2 text-sm mb-6">
                  <div className="flex text-bmr-ink">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{ratingAvg >= i + 1 ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <span className="text-muted">({reviewCount})</span>
                </div>
              )}

              {/* Stock Warning */}
              {totalStock > 0 && totalStock <= 5 && (
                <div className="mb-6 px-4 py-3 bg-surface-3 border border-line rounded">
                  <p className="text-sm font-medium text-bmr-acc-red">
                    Only {totalStock} left in stock
                  </p>
                </div>
              )}

              {totalStock === 0 && (
                <div className="mb-6 px-4 py-3 bg-surface-3 border border-line rounded">
                  <p className="text-sm font-medium">Out of stock</p>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <SizeSelect
                    sizes={product.sizes}
                    selected={selectedSize}
                    onChange={setSelectedSize}
                  />
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <ColorSelect
                    colors={product.colors}
                    selected={selectedColor}
                    onChange={setSelectedColor}
                  />
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="mb-6">
                <div className="flex gap-3 mb-4">
                  <QtyStepper value={qty} onChange={setQty} max={totalStock} />
                </div>
                <AddToCartButton
                  onClick={handleAddToCart}
                  disabled={totalStock === 0}
                />
              </div>

              {/* Trust Badges */}
              <div className="flex flex-col gap-2 text-sm text-muted mb-8 pb-8 border-b border-line">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Free returns 30 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Free shipping over $89</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout</span>
                </div>
              </div>

              {/* Accordions */}
              <div className="space-y-3">
                {/* Product Details */}
                <div className="border-b border-line">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <span className="font-medium">Product Details</span>
                    <span className="text-xl">{openAccordion === 'details' ? '−' : '+'}</span>
                  </button>
                  {openAccordion === 'details' && (
                    <div
                      className="pb-4 text-sm text-muted prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: accordionContent.details }}
                    />
                  )}
                </div>

                {/* Shipping & Returns */}
                <div className="border-b border-line">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <span className="font-medium">Shipping & Returns</span>
                    <span className="text-xl">{openAccordion === 'shipping' ? '−' : '+'}</span>
                  </button>
                  {openAccordion === 'shipping' && (
                    <div
                      className="pb-4 text-sm text-muted prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: accordionContent.shipping }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* Related Products */}
        {recommendations.length > 0 && (
          <div className="border-t border-line bg-surface-2 py-12 lg:py-16">
            <Container>
              <h2 className="font-display text-2xl mb-8">Complete the look</h2>
              <ProductGrid products={recommendations} />
            </Container>
          </div>
        )}

        {/* Mobile Sticky Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-2 border-t border-line p-4 z-40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-display text-xl">
                {formatPrice(product.price || product.basePrice, currency)}
              </div>
              {(selectedSize || selectedColor) && (
                <div className="text-xs text-muted">
                  {selectedSize && <span>{selectedSize}</span>}
                  {selectedSize && selectedColor && <span className="mx-1">•</span>}
                  {selectedColor && <span>{selectedColor}</span>}
                </div>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={totalStock === 0}
              className="px-8 py-3 bg-bmr-ink text-surface-2 rounded hover:bg-bmr-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Add to cart
            </button>
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
            image: galleryImages[0],
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
