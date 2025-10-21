'use client';

import { useState } from 'react';
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

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { product, isLoading } = useProductBySlug(slug);
  const { products: relatedProducts } = useProductsByCategory(product?.categoryId || null);
  const { currency } = useLocale();
  const addToCart = useCartStore((state) => state.add);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSleeve, setSelectedSleeve] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  // Log product view when product loads
  if (product && !isLoading) {
    logProductView(product.id, product.name, product.categoryId);
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
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      qty,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      sleeve: selectedSleeve || undefined,
      image: product.thumbnail || product.images[0],
    });

    logAddToCart(product.id, product.name, product.price, qty);
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

  // Filter related products (same category, exclude current)
  const recommendations = relatedProducts
    ? relatedProducts.filter((p) => p.id !== product.id).slice(0, 8)
    : [];

  // Accordion content
  const accordionItems = [
    {
      title: 'Product Details',
      content: product.descriptionHtml,
      defaultOpen: true,
    },
  ];

  if (product.fabricHtml) {
    accordionItems.push({
      title: 'Fabric & Care',
      content: product.fabricHtml,
    });
  }

  if (product.careHtml) {
    accordionItems.push({
      title: 'Care Instructions',
      content: product.careHtml,
    });
  }

  accordionItems.push({
    title: 'Shipping & Returns',
    content: '<p>Free shipping on orders over $99. Easy returns within 14 days.</p>',
  });

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <>
      <div className="bg-surface-2">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumbs
            items={[
              { label: 'Shop', href: '/shop' },
              { label: product.name, href: `/product/${product.slug}` },
            ]}
          />

          <div className="mt-12 lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            {/* Gallery */}
            <div>
              <ProductGallery images={product.images} alt={product.name} />
            </div>

            {/* Product Info */}
            <div className="mt-8 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
              {product.badges && product.badges.length > 0 && (
                <div className="flex gap-2 mb-6">
                  {product.badges.map((badge) => (
                    <span
                      key={badge}
                      className="px-4 py-1.5 bg-bmr-ink text-surface-2 text-xs uppercase tracking-wideish rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="font-display text-3xl lg:text-4xl leading-tight mb-3">{product.name}</h1>

              {product.subtitle && (
                <p className="text-lg text-bmr-muted leading-relaxed mb-8">{product.subtitle}</p>
              )}

              <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-line">
                <span className="font-display text-3xl">
                  {formatPrice(product.price, currency)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-bmr-muted line-through">
                    {formatPrice(product.compareAtPrice!, currency)}
                  </span>
                )}
              </div>

              {product.stock === 0 && (
                <div className="mb-8 p-6 bg-surface-3 rounded-lg border border-line">
                  <p className="text-sm font-medium text-bmr-ink">Currently out of stock</p>
                  <p className="text-sm text-bmr-muted mt-1">Sign up for restock notifications</p>
                </div>
              )}

              {product.stock > 0 && product.stock <= 5 && (
                <div className="mb-8 p-6 bg-surface-3 rounded-lg border border-line">
                  <p className="text-sm font-medium text-bmr-acc-red">Only {product.stock} left in stock</p>
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

                {product.sleeve && (
                  <SleeveSelect
                    sleeves={[product.sleeve]}
                    selected={selectedSleeve}
                    onChange={setSelectedSleeve}
                  />
                )}

                <div className="flex items-center gap-4">
                  <QtyStepper value={qty} onChange={setQty} max={product.stock} />
                  <div className="flex-1">
                    <AddToCartButton
                      onClick={handleAddToCart}
                      disabled={product.stock === 0}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <PdpAccordions items={accordionItems} />
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="border-t border-line bg-surface-1 py-16 lg:py-24">
            <div className="container-wide">
              <h2 className="font-display text-3xl lg:text-4xl mb-12 text-center">
                You May Also Like
              </h2>
              <ProductGrid products={recommendations} />
            </div>
          </div>
        )}
      </div>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: product.images,
            description: product.subtitle || product.name,
            offers: {
              '@type': 'Offer',
              price: product.price / 100,
              priceCurrency: currency,
              availability:
                product.stock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            },
          }),
        }}
      />
    </>
  );
}
