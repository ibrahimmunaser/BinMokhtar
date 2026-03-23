'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { ProductGallery } from '@/components/products/ProductGallery';
import { SizeSelect } from '@/components/products/SizeSelect';
import { ColorSelect } from '@/components/products/ColorSelect';
import { QtyStepper } from '@/components/products/QtyStepper';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { useProductBySlug, useProductsByCategory } from '@/hooks/useData';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/contexts/ToastContext';
import { logProductView, logAddToCart } from '@/lib/analytics';
import { Check, Truck, Shield, Star } from 'lucide-react';

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

  // Get variants from product (loaded from Firebase subcollection)
  const variants = useMemo(() => {
    return (product as any)?.variants as Array<{ 
      id: string; 
      size?: string; 
      color?: string; 
      stock: number; 
      sku: string;
      price?: number;
    }> || [];
  }, [product]);

  // Get stock for the currently selected size+color combination
  const selectedVariantStock = useMemo(() => {
    if (!variants.length) {
      console.log('⚠️ No variants found, using totalStock:', totalStock);
      return totalStock; // Fall back to total stock if no variants
    }
    
    // Debug: Log variants for troubleshooting
    console.log('🔍 Stock calculation debug:', {
      totalVariants: variants.length,
      selectedSize,
      selectedColor,
      productHasSizes: !!product?.sizes?.length,
      productHasColors: !!product?.colors?.length,
      allVariants: variants.map(v => ({ size: v.size, color: v.color, stock: v.stock })),
    });
    
    // If we need both size and color
    if (product?.sizes?.length && product?.colors?.length) {
      if (!selectedSize || !selectedColor) {
        console.log('⚠️ Both size and color required, but not selected');
        return 0; // Need both selected
      }
      const variant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
      console.log('✅ Found exact variant (size+color):', { 
        size: selectedSize, 
        color: selectedColor, 
        variant: variant ? { size: variant.size, color: variant.color, stock: variant.stock } : null,
        stock: variant?.stock ?? 0 
      });
      return variant?.stock ?? 0;
    }
    
    // If we only have sizes
    if (product?.sizes?.length && selectedSize) {
      const sizeVariants = variants.filter(v => v.size === selectedSize);
      const total = sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      console.log('📏 Size-only stock:', { 
        size: selectedSize, 
        variants: sizeVariants.length, 
        sizeVariants: sizeVariants.map(v => ({ size: v.size, color: v.color, stock: v.stock })),
        total 
      });
      return total;
    }
    
    // If we only have colors
    if (product?.colors?.length && selectedColor) {
      const colorVariants = variants.filter(v => v.color === selectedColor);
      const total = colorVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      console.log('🎨 Color-only stock:', { color: selectedColor, variants: colorVariants.length, total });
      return total;
    }
    
    console.log('⚠️ Fallback to total stock:', totalStock);
    return totalStock;
  }, [variants, selectedSize, selectedColor, product, totalStock]);

  // Check if add to cart should be disabled
  const canAddToCart = useMemo(() => {
    if (totalStock === 0) return false;
    
    // If product has sizes, require size selection
    if (product?.sizes?.length && !selectedSize) return false;
    
    // If product has colors, require color selection
    if (product?.colors?.length && !selectedColor) return false;
    
    // Check variant stock
    if (selectedVariantStock === 0) return false;
    
    // Check quantity doesn't exceed stock
    if (qty > selectedVariantStock) return false;
    
    return true;
  }, [totalStock, product, selectedSize, selectedColor, selectedVariantStock, qty]);

  // Auto-adjust quantity when max stock changes
  useEffect(() => {
    if (selectedVariantStock > 0 && qty > selectedVariantStock) {
      console.log(`⚠️ Quantity (${qty}) exceeds max stock (${selectedVariantStock}), adjusting to ${selectedVariantStock}`);
      setQty(selectedVariantStock);
    }
  }, [selectedVariantStock, qty]);

  // Log product view
  if (product && !isLoading) {
    logProductView(product.id, product.titleEn, product.category);
  }

  const handleAddToCart = () => {
    if (!product) return;

    // STRICT VALIDATION: Check stock FIRST before anything else
    if (selectedVariantStock === 0) {
      alert('This item is out of stock. Please select a different size or color.');
      return;
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Please select a color');
      return;
    }

    // Check stock for the selected variant AGAIN (double-check)
    if (selectedVariantStock === 0) {
      alert('Sorry, this item is out of stock');
      return;
    }
    
    if (qty > selectedVariantStock) {
      alert(`Sorry, only ${selectedVariantStock} items available`);
      return;
    }
    
    // Final check: Make sure we have a valid variant with stock
    let selectedVariant;
    
    // If product has both sizes and colors
    if (product.sizes?.length && product.colors?.length) {
      selectedVariant = variants.find(v => 
        v.size === selectedSize && v.color === selectedColor
      );
    }
    // If product has only sizes
    else if (product.sizes?.length) {
      selectedVariant = variants.find(v => v.size === selectedSize);
    }
    // If product has only colors
    else if (product.colors?.length) {
      selectedVariant = variants.find(v => v.color === selectedColor);
    }
    // No variants (simple product)
    else {
      selectedVariant = variants[0]; // Use first variant if exists
    }

    console.log('🔍 Selected variant lookup:', {
      hasSizes: !!product.sizes?.length,
      hasColors: !!product.colors?.length,
      selectedSize,
      selectedColor,
      foundVariant: selectedVariant ? { 
        id: selectedVariant.id, 
        size: selectedVariant.size, 
        color: selectedVariant.color, 
        stock: selectedVariant.stock 
      } : null
    });

    if (!selectedVariant) {
      alert('Could not find the selected product variant. Please try again.');
      return;
    }
    
    if (selectedVariant.stock === 0) {
      alert('This variant is out of stock. Please select a different option.');
      return;
    }

    const itemTitle = product.titleEn || (product as any).name;
    const itemImage = product.primaryImageUrl || (product as any).thumbnail || galleryImages[0];
    
    // Convert weight from grams to ounces (1 gram = 0.035274 oz)
    const weightInOz = product.weight_grams ? product.weight_grams * 0.035274 : undefined;
    
    addToCart({
      variantId: selectedVariant?.id || product.id,
      productId: product.id,
      title: itemTitle,
      name: itemTitle, // alias for compatibility
      sku: selectedVariant?.sku || product.sku,
      priceAtAdd: selectedVariant?.price || product.price || product.basePrice,
      price: selectedVariant?.price || product.price || product.basePrice, // alias for compatibility
      qty,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      imageUrl: itemImage,
      image: itemImage, // alias for compatibility
      slug: product.slug,
      weight: weightInOz, // weight in ounces for shipping
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

              {/* Reviews Summary (clickable to scroll to reviews) */}
              <button
                onClick={() => {
                  const reviewsSection = document.getElementById('reviews-section');
                  if (reviewsSection) {
                    reviewsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity"
              >
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${ratingAvg >= i + 1 ? 'fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-muted">
                  {reviewCount > 0 ? `(${reviewCount} review${reviewCount !== 1 ? 's' : ''})` : 'No reviews yet'}
                </span>
              </button>

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
                    selectedColor={selectedColor}
                    variants={variants}
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
                    selectedSize={selectedSize}
                    variants={variants}
                  />
                </div>
              )}

              {/* Selected variant stock warning */}
              {selectedSize && selectedColor && selectedVariantStock > 0 && selectedVariantStock <= 5 && (
                <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-yellow-800">
                    Only {selectedVariantStock} left in this size & color
                  </p>
                </div>
              )}
              
              {selectedSize && selectedColor && selectedVariantStock === 0 && (
                <div className="mb-4 px-4 py-2 bg-bmr-acc-red/10 border border-bmr-acc-red/30 rounded">
                  <p className="text-sm font-medium text-bmr-acc-red">
                    This size & color combination is out of stock
                  </p>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="mb-6">
                <div className="flex gap-3 mb-4">
                  <QtyStepper value={qty} onChange={setQty} max={selectedVariantStock || totalStock} />
                </div>
                <AddToCartButton
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  outOfStock={
                    totalStock === 0 || 
                    (!!selectedSize && !!selectedColor && selectedVariantStock === 0)
                  }
                />
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

        {/* Reviews Section */}
        <div id="reviews-section" className="border-t border-line bg-surface-2">
          <Container className="py-8 lg:py-12">
            <ProductReviews
              productId={product.id}
              reviewCount={reviewCount}
              ratingAvg={ratingAvg}
            />
          </Container>
        </div>

        {/* Related Products */}
        {recommendations.length > 0 && (
          <div className="border-t border-line bg-surface-1 py-12 lg:py-16">
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
                  {selectedVariantStock > 0 && selectedVariantStock <= 5 && (
                    <span className="ml-2 text-yellow-600">({selectedVariantStock} left)</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="px-8 py-3 bg-bmr-ink text-surface-2 rounded hover:bg-bmr-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {selectedVariantStock === 0 && selectedSize && selectedColor ? 'Out of Stock' : 'Add to cart'}
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
