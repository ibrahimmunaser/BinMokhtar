'use client';

import { useState, useMemo, useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { FilterRail } from '@/components/products/FilterRail';
import { SortSelect } from '@/components/products/SortSelect';
import { ProductCard } from '@/components/products/ProductCard';
import { getAllProducts, getAllCategories } from '@/lib/firebaseAdminStore';
import type { FilterState, SortOption } from '@/types';

export default function ShopPage() {
  // Load products from localStorage (same as admin)
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const isLoading = false;

  useEffect(() => {
    // Load data from Firebase
    getAllProducts().then(products => setProducts(products));
    getAllCategories().then(cats => setCategories(cats));
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    sizes: [],
    colors: [],
    sleeves: [],
    priceRange: [0, 100000],
  });
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  // Extract available sizes and colors
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products?.forEach((p) => p.sizes?.forEach((s) => sizes.add(s)));
    return Array.from(sizes).sort();
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products?.forEach((p) => p.colors?.forEach((c) => colors.add(c)));
    return Array.from(colors);
  }, [products]);

  const availableSleeves = useMemo(() => {
    const sleeves = new Set<string>();
    products?.forEach((p) => {
      if (p.sleeve) sleeves.add(p.sleeve);
    });
    return Array.from(sleeves);
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products || [];

    // Apply filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => filters.categories.includes(p.categoryId));
    }
    if (filters.sizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.sizes?.some((s) => filters.sizes.includes(s))
      );
    }
    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) =>
        p.colors?.some((c) => filters.colors.includes(c))
      );
    }
    if (filters.sleeves.length > 0) {
      filtered = filtered.filter((p) =>
        p.sleeve && filters.sleeves.includes(p.sleeve)
      );
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
  }, [products, filters, sortOption]);

  // Removed loading state since we're using mock data

  return (
    <div className="bg-surface-1">
      <div className="container-wide py-12 lg:py-16">
        <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }]} />

        <div className="mt-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-6">
            <div>
              <h1 className="font-display text-4xl lg:text-5xl mb-2">All Products</h1>
              <p className="text-bmr-muted">
                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
              </p>
            </div>
            <SortSelect value={sortOption} onChange={setSortOption} />
          </div>

          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
            {/* Filter Rail - Desktop */}
            <aside className="hidden lg:block sticky top-24 self-start">
              <div className="bg-surface-2 rounded-lg p-6 border border-line">
                <FilterRail
                  filters={filters}
                  onChange={setFilters}
                  categories={categories}
                  availableSizes={availableSizes}
                  availableColors={availableColors}
                  availableSleeves={availableSleeves}
                />
              </div>
            </aside>

            {/* Products Grid */}
            <div className="min-h-[600px]">
              {filteredAndSortedProducts.length === 0 ? (
                <div className="bg-surface-2 rounded-lg border border-line p-12 text-center">
                  <h3 className="font-display text-2xl mb-4">No products found</h3>
                  <p className="text-bmr-muted mb-8">Try adjusting your filters</p>
                  <button
                    onClick={() => setFilters({
                      categories: [],
                      sizes: [],
                      colors: [],
                      sleeves: [],
                      priceRange: [0, 100000],
                    })}
                    className="btn-secondary"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      variant={{
                        id: product.id,
                        productId: product.id,
                        productSlug: product.slug,
                        productTitleEn: product.name,
                        productTitleAr: product.name,
                        category: 'THOBE',
                        sku: product.id,
                        size: product.sizes?.[0],
                        price: product.price,
                        compareAt: product.compareAtPrice,
                        stock: product.stock,
                        active: true,
                        imageUrl: product.thumbnail,
                        createdAt: product.createdAt,
                        updatedAt: product.updatedAt,
                      }}
                      showSoldOut
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



