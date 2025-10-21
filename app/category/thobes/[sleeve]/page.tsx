'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { FilterRail } from '@/components/products/FilterRail';
import { SortSelect } from '@/components/products/SortSelect';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts, useCategories } from '@/hooks/useData';
import type { FilterState, SortOption } from '@/types';

export default function ThobeSleevePage() {
  const params = useParams();
  const sleeve = params.sleeve as string; // 'short-sleeve' or 'long-sleeve'
  const sleeveType = sleeve === 'short-sleeve' ? 'short' : 'long';
  
  const { products: allProducts, isLoading } = useProducts();
  const { categories } = useCategories();

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    sizes: [],
    colors: [],
    sleeves: [sleeveType],
    priceRange: [0, 100000],
  });
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  // Filter products to thobes with specific sleeve
  const thobeProducts = useMemo(() => {
    return allProducts?.filter((p) => {
      // Assuming thobes have categoryId containing 'thobe'
      const isThobeCategory = p.categoryId.toLowerCase().includes('thobe');
      return isThobeCategory && p.sleeve === sleeveType;
    }) || [];
  }, [allProducts, sleeveType]);

  // Extract available filter options from thobe products
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    thobeProducts.forEach((p) => p.sizes?.forEach((s) => sizes.add(s)));
    return Array.from(sizes).sort();
  }, [thobeProducts]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    thobeProducts.forEach((p) => p.colors?.forEach((c) => colors.add(c)));
    return Array.from(colors);
  }, [thobeProducts]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...thobeProducts];

    if (filters.sizes.length > 0) {
      filtered = filtered.filter((p) => p.sizes?.some((s) => filters.sizes.includes(s)));
    }
    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) => p.colors?.some((c) => filters.colors.includes(c)));
    }
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) {
      filtered = filtered.filter(
        (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
      );
    }

    // Apply sorting
    switch (sortOption) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      default:
        break;
    }

    return filtered;
  }, [thobeProducts, filters, sortOption]);

  const pageTitle = sleeve === 'short-sleeve' ? 'Short Sleeve Thobes' : 'Long Sleeve Thobes';

  if (isLoading) {
    return (
      <Container className="py-12">
        <div className="text-center text-muted">Loading...</div>
      </Container>
    );
  }

  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: 'Thobes', href: '/category/thobes' },
          { label: pageTitle, href: `/category/thobes/${sleeve}` },
        ]}
      />

      <div className="mt-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl lg:text-4xl font-display">{pageTitle}</h1>
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
              availableSleeves={[]}
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


