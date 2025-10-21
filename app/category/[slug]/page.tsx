'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { FilterRail } from '@/components/products/FilterRail';
import { SortSelect } from '@/components/products/SortSelect';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useCategoryBySlug, useProductsByCategory, useCategories } from '@/hooks/useData';
import type { FilterState, SortOption } from '@/types';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { category, isLoading: categoryLoading } = useCategoryBySlug(slug);
  const { products: allProducts, isLoading: productsLoading } = useProductsByCategory(
    category?.id || null
  );
  const { categories } = useCategories();

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    sizes: [],
    colors: [],
    sleeves: [],
    priceRange: [0, 100000],
  });
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  // Extract available filter options
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    allProducts?.forEach((p) => p.sizes?.forEach((s) => sizes.add(s)));
    return Array.from(sizes).sort();
  }, [allProducts]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    allProducts?.forEach((p) => p.colors?.forEach((c) => colors.add(c)));
    return Array.from(colors);
  }, [allProducts]);

  const availableSleeves = useMemo(() => {
    const sleeves = new Set<string>();
    allProducts?.forEach((p) => {
      if (p.sleeve) sleeves.add(p.sleeve);
    });
    return Array.from(sleeves);
  }, [allProducts]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = allProducts || [];

    if (filters.sizes.length > 0) {
      filtered = filtered.filter((p) => p.sizes?.some((s) => filters.sizes.includes(s)));
    }
    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) => p.colors?.some((c) => filters.colors.includes(c)));
    }
    if (filters.sleeves && filters.sleeves.length > 0) {
      filtered = filtered.filter((p) => p.sleeve && filters.sleeves!.includes(p.sleeve));
    }
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) {
      filtered = filtered.filter((p) => {
        const productPrice = p.price || p.basePrice;
        return productPrice >= filters.priceRange[0] && productPrice <= filters.priceRange[1];
      });
    }

    // Apply sorting
    switch (sortOption) {
      case 'price-asc':
        filtered.sort((a, b) => (a.price || a.basePrice) - (b.price || b.basePrice));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.price || b.basePrice) - (a.price || a.basePrice));
        break;
      case 'newest':
        filtered.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any).seconds * 1000;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any).seconds * 1000;
          return bTime - aTime;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [allProducts, filters, sortOption]);

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
          <a href="/shop" className="text-muted hover:text-bmr-black underline">
            Back to shop
          </a>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: category.name, href: `/category/${slug}` }]} />

      <div className="mt-8">
        {category.description && (
          <div className="mb-8 max-w-2xl">
            <p className="text-lg text-muted">{category.description}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl lg:text-4xl font-display">{category.name}</h1>
          <SortSelect value={sortOption} onChange={setSortOption} />
        </div>

        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Filter Rail - Desktop */}
          <aside className="hidden lg:block">
            <FilterRail
              filters={filters}
              onChange={setFilters}
              categories={[]}
              availableSizes={availableSizes}
              availableColors={availableColors}
              availableSleeves={availableSleeves}
            />
          </aside>

          {/* Products Grid */}
          <div>
            <ProductGrid products={filteredAndSortedProducts} />
          </div>
        </div>
      </div>
    </Container>
  );
}
