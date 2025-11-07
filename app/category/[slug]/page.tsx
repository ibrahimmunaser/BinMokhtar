'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/products/ProductCard';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { useCategoryBySlug, useProductsByCategory } from '@/hooks/useData';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';

const ITEMS_PER_PAGE = 24;

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const COLORS = ['White', 'Black', 'Beige', 'Brown', 'Navy', 'Grey', 'Red', 'Green'];

// Category-specific hero images
const CATEGORY_HERO_IMAGES: Record<string, string> = {
  'shemaghs': '/images/shawls hero.png',
  'yemeni-shals': 'https://images.unsplash.com/photo-1601513445506-2ab0d4fb4229?w=1600&h=600&fit=crop',
  'short-sleeves': 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=1600&h=600&fit=crop',
  'long-sleeves': 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=1600&h=600&fit=crop',
  'kufis': 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600&h=600&fit=crop',
  'accessories': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1600&h=600&fit=crop',
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  
  const { category, isLoading: categoryLoading } = useCategoryBySlug(slug);
  const { products: allProducts, isLoading: productsLoading } = useProductsByCategory(
    category?.id || null
  );
  
  const [showFilters, setShowFilters] = useState(true);
  
  // Get filter/sort values from URL
  const sortBy = searchParams?.get('sort') || 'featured';
  const page = parseInt(searchParams?.get('page') || '1');
  const selectedSizes = searchParams?.get('sizes')?.split(',').filter(Boolean) || [];
  const selectedColors = searchParams?.get('colors')?.split(',').filter(Boolean) || [];
  const minPrice = searchParams?.get('minPrice') || '';
  const maxPrice = searchParams?.get('maxPrice') || '';

  // Update URL with new params
  const updateFilters = (key: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      } else {
        params.delete(key);
      }
    } else if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset to page 1 when filters change
    if (key !== 'page') {
      params.delete('page');
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Toggle size/color
  const toggleFilter = (key: string, value: string, current: string[]) => {
    const newValues = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilters(key, newValues);
  };

  // Clear all filters
  const clearAllFilters = () => {
    router.push(`/category/${slug}`, { scroll: false });
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...(allProducts || [])];

    // Filter by sizes
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => 
        p.sizes && p.sizes.some((s: string) => selectedSizes.includes(s))
      );
    }

    // Filter by colors
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => 
        p.colors && p.colors.some((c: string) => selectedColors.includes(c))
      );
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filtered = filtered.filter(p => {
        const price = (p.price || p.basePrice) / 100;
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => (a.price || a.basePrice) - (b.price || b.basePrice));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.price || b.basePrice) - (a.price || a.basePrice));
        break;
      case 'newest':
        filtered.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.seconds * 1000 || 0;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.seconds * 1000 || 0;
          return bTime - aTime;
        });
        break;
      default: // featured
        filtered.sort((a, b) => (b.orders || 0) - (a.orders || 0));
    }

    return filtered;
  }, [allProducts, selectedSizes, selectedColors, minPrice, maxPrice, sortBy]);

  // Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Active filters count
  const activeFiltersCount = selectedSizes.length + selectedColors.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  // Get hero image for category
  const heroImage = CATEGORY_HERO_IMAGES[slug] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=600&fit=crop';

  if (categoryLoading || productsLoading) {
    return (
      <Container className="py-12">
        <div className="text-center text-muted">Loading...</div>
      </Container>
    );
  }

  if (!category) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-display mb-4">Category not found</h1>
          <Link href="/shop" className="text-muted hover:text-bmr-ink underline">
            Back to shop
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[40vh] min-h-[300px] max-h-[500px] bg-surface-3">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={category.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        <Container className="relative h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="font-display text-4xl lg:text-6xl mb-3">{category.name.toUpperCase()}</h1>
            {category.description && (
              <p className="text-lg lg:text-xl text-white/90">{category.description}</p>
            )}
          </div>
        </Container>
      </section>

      {/* Breadcrumb + Toolbar */}
      <div className="border-b border-line bg-surface-2">
        <Container className="py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Breadcrumb */}
            <div className="hidden lg:block">
              <Breadcrumbs
                items={[
                  { label: 'Shop', href: '/shop' },
                  { label: category.name, href: `/category/${slug}` },
                ]}
              />
            </div>

            {/* Center/Left: Item count */}
            <div className="text-sm text-muted">
              {productsLoading ? (
                'Loading...'
              ) : (
                `Showing ${startIndex + 1}–${Math.min(endIndex, totalItems)} of ${totalItems}`
              )}
            </div>

            {/* Right: Sort + Filters Toggle */}
            <div className="flex items-center gap-4">
              {/* Filters Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-line rounded hover:bg-surface-3 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-bmr-ink text-surface-2 text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => updateFilters('sort', e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-line rounded bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer text-sm"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Filters Bar */}
      {(showFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
        <div className="border-b border-line bg-surface-1">
          <Container className="py-6">
            <div className="space-y-6">
              {/* Active Filters Pills */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Active filters:</span>
                  {selectedSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleFilter('sizes', size, selectedSizes)}
                      className="flex items-center gap-1 px-3 py-1 bg-bmr-ink text-surface-2 text-sm rounded-full hover:bg-bmr-fg transition-colors"
                    >
                      {size}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                  {selectedColors.map(color => (
                    <button
                      key={color}
                      onClick={() => toggleFilter('colors', color, selectedColors)}
                      className="flex items-center gap-1 px-3 py-1 bg-bmr-ink text-surface-2 text-sm rounded-full hover:bg-bmr-fg transition-colors"
                    >
                      {color}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                  {(minPrice || maxPrice) && (
                    <button
                      onClick={() => {
                        updateFilters('minPrice', '');
                        updateFilters('maxPrice', '');
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-bmr-ink text-surface-2 text-sm rounded-full hover:bg-bmr-fg transition-colors"
                    >
                      ${minPrice || '0'} - ${maxPrice || '∞'}
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-muted hover:text-bmr-ink underline"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Size */}
                <div>
                  <label className="block text-sm font-medium mb-3">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => toggleFilter('sizes', size, selectedSizes)}
                        className={`px-4 py-2 text-sm border rounded transition-colors ${
                          selectedSizes.includes(size)
                            ? 'bg-bmr-ink text-surface-2 border-bmr-ink'
                            : 'border-line hover:border-bmr-ink'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium mb-3">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => toggleFilter('colors', color, selectedColors)}
                        className={`px-4 py-2 text-sm border rounded transition-colors ${
                          selectedColors.includes(color)
                            ? 'bg-bmr-ink text-surface-2 border-bmr-ink'
                            : 'border-line hover:border-bmr-ink'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-3">Price Range</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => updateFilters('minPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:ring-1 focus:ring-bmr-ink"
                    />
                    <span className="text-muted">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => updateFilters('maxPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:ring-1 focus:ring-bmr-ink"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* Product Grid */}
      <section className="py-12 lg:py-16 bg-surface-1">
        <Container>
          {productsLoading ? (
            <div className="text-center py-20 text-muted">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            // Empty State
            <div className="text-center py-20">
              <h3 className="font-display text-2xl mb-4">No products found</h3>
              <p className="text-muted mb-6">Try adjusting your filters or browse all products</p>
              <button
                onClick={clearAllFilters}
                className="px-8 py-3 bg-bmr-ink text-surface-2 rounded hover:bg-bmr-fg transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    variant={{
                      id: product.id,
                      productId: product.id,
                      productSlug: product.slug,
                      productTitleEn: product.titleEn || product.name,
                      productTitleAr: product.titleAr || product.name,
                      category: product.category || 'THOBE',
                      sku: product.id,
                      size: product.sizes?.[0],
                      price: product.price || product.basePrice,
                      compareAt: product.compareAtPrice,
                      stock: product.counts?.totalStock ?? product.stock ?? 0,
                      active: true,
                      imageUrl: product.defaultImage?.url || product.thumbnail || product.images?.[0],
                      createdAt: product.createdAt,
                      updatedAt: product.updatedAt,
                    }}
                    showSoldOut
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  {/* Previous */}
                  <button
                    onClick={() => updateFilters('page', String(page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-line rounded hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      // Show first, last, current, and neighbors
                      return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                    })
                    .map((p, i, arr) => {
                      // Add ellipsis
                      if (i > 0 && p - arr[i - 1] > 1) {
                        return (
                          <span key={`ellipsis-${p}`} className="px-2">...</span>
                        );
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => updateFilters('page', String(p))}
                          className={`px-4 py-2 border rounded transition-colors ${
                            page === p
                              ? 'bg-bmr-ink text-surface-2 border-bmr-ink'
                              : 'border-line hover:bg-surface-3'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                  {/* Next */}
                  <button
                    onClick={() => updateFilters('page', String(page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-line rounded hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </>
  );
}
