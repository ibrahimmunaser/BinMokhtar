'use client';

import { useState, useMemo, useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { FilterRail } from '@/components/products/FilterRail';
import { SortSelect } from '@/components/products/SortSelect';
import { ProductCard } from '@/components/products/ProductCard';
import { getStorefrontProducts } from '@/lib/storefront';
import { getAllCategories } from '@/lib/firebaseAdminStore';
import type { FilterState, SortOption } from '@/types';

export default function ShopPage() {
  // Load products from storefront (only ACTIVE products)
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Load ACTIVE products only from storefront API
    Promise.all([
      getStorefrontProducts().catch(err => {
        console.error('Error loading products:', err);
        setError('Failed to load products');
        return [];
      }),
      getAllCategories().catch(err => {
        console.error('Error loading categories:', err);
        return [];
      })
    ]).then(([products, cats]) => {
      setProducts(products);
      setCategories(cats);
      setIsLoading(false);
    });
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    subcategories: [],
    sizes: [],
    colors: [],
    sleeves: [],
    priceRange: [0, 100000],
  });
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  // Extract available sizes and colors
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products?.forEach((p) => p.sizes?.forEach((s: string) => sizes.add(s)));
    return Array.from(sizes).sort();
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products?.forEach((p) => p.colors?.forEach((c: string) => colors.add(c)));
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

    // Apply main category filters (Men, Boys, Shemaghs)
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => {
        const categoryId = p.categoryId?.toLowerCase();
        return filters.categories.some((cat: any) => {
          const catLower = cat.toLowerCase();
          // Match by categoryId field
          if (categoryId === catLower) return true;
          // Match Men/Boys by audience
          if (catLower === 'men' && p.audience === 'MEN') return true;
          if (catLower === 'boys' && p.audience === 'BOYS') return true;
          // Match Shemaghs by category
          if (catLower === 'shemaghs' && p.category === 'SHAAL') return true;
          return false;
        });
      });
    }
    // Apply subcategory filters (emirati, saudi, thobes, traditional, yemeni)
    if (filters.subcategories && filters.subcategories.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.subcategory) return false;
        const productSubcat = p.subcategory.toLowerCase();
        // Match against filter values (slugs like 'emirati', 'saudi', etc.)
        return filters.subcategories!.some(filterSub => {
          const filterLower = filterSub.toLowerCase();
          return productSubcat === filterLower || 
                 productSubcat === filterLower.replace(' thobes', '') ||
                 productSubcat.includes(filterLower);
        });
      });
    }
    if (filters.sizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.sizes?.some((s: string) => filters.sizes.includes(s))
      );
    }
    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) =>
        p.colors?.some((c: string) => filters.colors.includes(c))
      );
    }
    if (filters.sleeves && filters.sleeves.length > 0) {
      filtered = filtered.filter((p) =>
        p.sleeve && filters.sleeves!.includes(p.sleeve)
      );
    }
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) {
      filtered = filtered.filter((p) => {
        const productPrice = p.price || p.basePrice;
        return productPrice >= filters.priceRange[0] && productPrice <= filters.priceRange[1];
      });
    }

    // Apply sorting
    switch (sortOption) {
      case 'priceAsc':
        filtered.sort((a, b) => (a.price || a.basePrice) - (b.price || b.basePrice));
        break;
      case 'priceDesc':
        filtered.sort((a, b) => (b.price || b.basePrice) - (a.price || a.basePrice));
        break;
      case 'new':
        filtered.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any).seconds * 1000;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any).seconds * 1000;
          return bTime - aTime;
        });
        break;
      case 'featured':
      case 'popular':
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
              {isLoading ? (
                <div className="text-center py-20 text-bmr-muted">
                  <div className="inline-block w-8 h-8 border-4 border-bmr-ink border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Loading products...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-center">
                  <p>{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="bg-surface-2 rounded-lg border border-line p-12 text-center">
                  <h3 className="font-display text-2xl mb-4">No products found</h3>
                  <p className="text-bmr-muted mb-8">Try adjusting your filters</p>
                  <button
                    onClick={() => setFilters({
                      categories: [],
                      subcategories: [],
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
                  {filteredAndSortedProducts.map((product) => {
                    // Generate fallback slug from name if slug is missing
                    const productSlug = product.slug || 
                      (product.titleEn || (product as any).name || product.id || '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');
                    
                    return (
                    <ProductCard
                      key={product.id}
                      variant={{
                        id: product.id,
                        productId: product.id,
                        productSlug: productSlug,
                        productTitleEn: product.titleEn || (product as any).name || '',
                        productTitleAr: product.titleAr || (product as any).name || '',
                        category: product.category || 'THOBE',
                        sku: product.id,
                        size: product.sizes?.[0],
                        price: product.price || product.basePrice,
                        compareAt: undefined,
                        stock: product.counts?.totalStock ?? 0,
                        active: true,
                        imageUrl: product.primaryImageUrl || (product as any).thumbnail || (product as any).images?.[0] || '',
                        createdAt: product.createdAt,
                        updatedAt: product.updatedAt,
                      }}
                      showSoldOut
                    />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



