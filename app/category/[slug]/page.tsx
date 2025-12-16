'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/products/ProductCard';
import { Breadcrumbs } from '@/components/products/Breadcrumbs';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { FIREBASE_IMAGES } from '@/lib/firebase-images';

const ITEMS_PER_PAGE = 24;

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

const SIZES = ['54', '56', '58', '60', '62'];
const COLORS = ['White', 'Black', 'Beige', 'Brown', 'Navy', 'Grey', 'Cream', 'Olive'];

// Main categories structure
const MAIN_CATEGORIES: Record<string, {
  name: string;
  description: string;
}> = {
  'men': {
    name: 'Men',
    description: 'Traditional Islamic attire for men',
  },
  'women': {
    name: 'Women',
    description: 'Traditional Islamic attire for women',
  },
  'boys': {
    name: 'Boys',
    description: 'Traditional Islamic attire for boys',
  },
  'girls': {
    name: 'Girls',
    description: 'Traditional Islamic attire for girls',
  },
  'shemaghs': {
    name: 'Shemaghs',
    description: 'Traditional head scarves',
  },
};

// Fallback subcategories (shown only if Firebase returns empty)
const FALLBACK_SUBCATEGORIES: Record<string, {
  slug: string;
  name: string;
  description: string;
  parentCategoryId: string;
}[]> = {
  'men': [
    { slug: 'emirati', name: 'Emirati Thobes', description: 'Emirati style thobes', parentCategoryId: 'Men' },
    { slug: 'saudi', name: 'Saudi Thobes', description: 'Saudi style thobes', parentCategoryId: 'Men' },
  ],
  'boys': [
    { slug: 'thobes', name: 'Emirati Thobes', description: 'Boys Emirati thobes', parentCategoryId: 'Boys' },
  ],
  'shemaghs': [
    { slug: 'traditional', name: 'Traditional', description: 'Traditional shemaghs', parentCategoryId: 'Shemaghs' },
    { slug: 'yemeni', name: 'Yemeni', description: 'Yemeni style shemaghs', parentCategoryId: 'Shemaghs' },
  ],
};

// All fallback subcategory slugs for lookup
const ALL_FALLBACK_SUBCATEGORIES = Object.values(FALLBACK_SUBCATEGORIES).flat();

// Subcategory data from Firebase
interface SubcategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategoryId: string;
  active: boolean;
}

// Category-specific hero images with positioning (loaded from Firebase Storage)
const CATEGORY_HERO_CONFIG: Record<string, { image: string; position: string }> = {
  'men': { image: FIREBASE_IMAGES.HOME_MENS_THOBE, position: 'center 20%' },
  'boys': { image: FIREBASE_IMAGES.BOYS_HERO, position: 'center 30%' },
  'shemaghs': { image: FIREBASE_IMAGES.HOME_SHEMAGHS, position: 'center center' },
  'emirati': { image: FIREBASE_IMAGES.HERO_EMIRATI, position: 'center 30%' },
  'saudi': { image: FIREBASE_IMAGES.HERO_SAUDI, position: 'center 30%' },
  'thobes': { image: FIREBASE_IMAGES.BOYS_HERO, position: 'center 30%' },
  'traditional': { image: FIREBASE_IMAGES.HERO_TRADITIONAL, position: 'center 25%' },
  'yemeni': { image: FIREBASE_IMAGES.HERO_YEMENI, position: 'right 25%' },
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  
  // Dynamic subcategories from Firebase
  const [allSubcategories, setAllSubcategories] = useState<SubcategoryData[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(true);
  
  // Determine if this is a main category or a subcategory
  const slugLower = slug.toLowerCase();
  const isMainCategory = !!MAIN_CATEGORIES[slugLower];
  
  // Check if it's a fallback subcategory (used when Firebase is empty)
  const fallbackSubcategory = ALL_FALLBACK_SUBCATEGORIES.find(sub => sub.slug === slugLower);
  
  // For subcategories, find the matching one from Firebase data OR use fallback
  const matchedSubcategory = useMemo(() => {
    if (isMainCategory) return null;
    // First check Firebase data
    const fromFirebase = allSubcategories.find(sub => sub.slug.toLowerCase() === slugLower);
    if (fromFirebase) return fromFirebase;
    // Fall back to fallback subcategory only if Firebase returned empty
    if (allSubcategories.length === 0 && fallbackSubcategory) {
      return {
        id: fallbackSubcategory.slug,
        slug: fallbackSubcategory.slug,
        name: fallbackSubcategory.name,
        description: fallbackSubcategory.description,
        parentCategoryId: fallbackSubcategory.parentCategoryId,
        active: true,
      } as SubcategoryData;
    }
    return null;
  }, [isMainCategory, allSubcategories, slugLower, fallbackSubcategory]);
  
  const isSubcategory = !isMainCategory && (!!matchedSubcategory || (allSubcategories.length === 0 && !!fallbackSubcategory));
  
  // Get category info - either from main categories or from matched subcategory
  const categoryInfo = useMemo(() => {
    if (isMainCategory) {
      return MAIN_CATEGORIES[slugLower];
    }
    if (matchedSubcategory) {
      return {
        name: matchedSubcategory.name,
        description: matchedSubcategory.description || '',
      };
    }
    // Fall back only if Firebase is empty
    if (allSubcategories.length === 0 && fallbackSubcategory) {
      return {
        name: fallbackSubcategory.name,
        description: fallbackSubcategory.description,
      };
    }
    // Fallback for unknown slugs
    return null;
  }, [isMainCategory, slugLower, matchedSubcategory, fallbackSubcategory, allSubcategories.length]);
  
  // Get parent category for subcategories
  const parentCategory = useMemo(() => {
    if (!isSubcategory) return null;
    if (matchedSubcategory) {
      const parentId = matchedSubcategory.parentCategoryId.toLowerCase();
      return MAIN_CATEGORIES[parentId] || null;
    }
    if (allSubcategories.length === 0 && fallbackSubcategory) {
      const parentId = fallbackSubcategory.parentCategoryId.toLowerCase();
      return MAIN_CATEGORIES[parentId] || null;
    }
    return null;
  }, [isSubcategory, matchedSubcategory, fallbackSubcategory, allSubcategories.length]);
  
  // Get subcategories for the current main category (for filtering) - from Firebase with fallback
  const categorySubcategories = useMemo(() => {
    if (!isMainCategory) return [];
    
    // Map slug to parent category ID (case-sensitive as stored in Firebase)
    const parentId = slugLower.charAt(0).toUpperCase() + slugLower.slice(1);
    const firebaseSubs = allSubcategories.filter(sub => 
      sub.parentCategoryId === parentId && sub.active !== false
    );
    
    // If Firebase has data, use it
    if (firebaseSubs.length > 0) {
      return firebaseSubs;
    }
    
    // Fall back to defaults if Firebase is empty
    return (FALLBACK_SUBCATEGORIES[slugLower] || []).map(sub => ({
      id: sub.slug,
      slug: sub.slug,
      name: sub.name,
      description: sub.description,
      parentCategoryId: sub.parentCategoryId,
      active: true,
    }));
  }, [isMainCategory, slugLower, allSubcategories]);
  
  // Fetch subcategories on mount
  useEffect(() => {
    const fetchSubcategories = async () => {
      setIsLoadingSubcategories(true);
      try {
        const response = await fetch('/api/admin/subcategories');
        const data = await response.json();
        if (data.success) {
          setAllSubcategories(data.subcategories || []);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      } finally {
        setIsLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, []);
  
  // Get filter/sort values from URL
  const sortBy = searchParams?.get('sort') || 'featured';
  const page = parseInt(searchParams?.get('page') || '1');
  const selectedSizes = searchParams?.get('sizes')?.split(',').filter(Boolean) || [];
  const selectedColors = searchParams?.get('colors')?.split(',').filter(Boolean) || [];
  const selectedSubcategory = searchParams?.get('subcategory') || '';
  const minPrice = searchParams?.get('minPrice') || '';
  const maxPrice = searchParams?.get('maxPrice') || '';

  // Fetch products based on category/subcategory
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/products?status=ACTIVE');
        const data = await response.json();
        
        if (data.success && data.products) {
          let filtered = data.products;
          
          if (isSubcategory && matchedSubcategory) {
            // Filter by subcategory slug (case-insensitive)
            const subcategorySlug = matchedSubcategory.slug.toLowerCase();
            const parentSlug = matchedSubcategory.parentCategoryId.toLowerCase();
            
            filtered = filtered.filter((p: any) => {
              // Match subcategory field against slug
              const productSubcat = p.subcategory?.toLowerCase();
              const matchesSubcategory = productSubcat === subcategorySlug || 
                productSubcat === subcategorySlug.replace(' thobes', '') ||
                productSubcat === subcategorySlug.replace('-', ' ');
              
              // Also check parent category for men/boys
              let matchesParent = true;
              if (parentSlug === 'men') {
                matchesParent = p.audience === 'MEN' || p.categoryId?.toLowerCase() === 'men';
              } else if (parentSlug === 'boys') {
                matchesParent = p.audience === 'BOYS' || p.categoryId?.toLowerCase() === 'boys';
              } else if (parentSlug === 'shemaghs') {
                matchesParent = p.category === 'SHAAL' || p.categoryId?.toLowerCase() === 'shemaghs';
              } else if (parentSlug === 'women') {
                matchesParent = p.categoryId?.toLowerCase() === 'women';
              } else if (parentSlug === 'girls') {
                matchesParent = p.categoryId?.toLowerCase() === 'girls';
              }
              
              return matchesSubcategory && matchesParent;
            });
          } else if (isMainCategory) {
            // Filter by main category slug
            const categorySlug = slugLower;
            filtered = filtered.filter((p: any) => {
              if (categorySlug === 'men') {
                return p.audience === 'MEN' || p.categoryId?.toLowerCase() === 'men';
              } else if (categorySlug === 'boys') {
                return p.audience === 'BOYS' || p.categoryId?.toLowerCase() === 'boys';
              } else if (categorySlug === 'shemaghs') {
                return p.category === 'SHAAL' || p.categoryId?.toLowerCase() === 'shemaghs';
              } else if (categorySlug === 'women') {
                return p.categoryId?.toLowerCase() === 'women';
              } else if (categorySlug === 'girls') {
                return p.categoryId?.toLowerCase() === 'girls';
              }
              return p.categoryId?.toLowerCase() === categorySlug;
            });
          }
          
          setProducts(filtered);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
      setIsLoading(false);
    };

    // Wait for subcategories to load before fetching products (for subcategory pages)
    // But allow fallback subcategories to work immediately if Firebase is empty
    if (isLoadingSubcategories && !fallbackSubcategory) return;
    
    if (isMainCategory || matchedSubcategory || (allSubcategories.length === 0 && fallbackSubcategory)) {
      fetchProducts();
    } else if (!isLoadingSubcategories) {
      // Unknown category/subcategory
      setIsLoading(false);
    }
  }, [slug, slugLower, isMainCategory, isSubcategory, matchedSubcategory, fallbackSubcategory, isLoadingSubcategories, allSubcategories.length]);

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
    let filtered = [...products];

    // Filter by subcategory (for main category pages like 'men')
    if (selectedSubcategory) {
      filtered = filtered.filter(p => 
        p.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }

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
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime() || 0;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime() || 0;
          return bTime - aTime;
        });
        break;
      default: // featured
        filtered.sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return (b.counts?.ratingAvg || 0) - (a.counts?.ratingAvg || 0);
        });
    }

    return filtered;
  }, [products, selectedSubcategory, selectedSizes, selectedColors, minPrice, maxPrice, sortBy]);

  // Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Active filters count
  const activeFiltersCount = selectedSizes.length + selectedColors.length + (selectedSubcategory ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  // Get hero image and position for category (with fallback for dynamic subcategories)
  const heroConfig = CATEGORY_HERO_CONFIG[slugLower] || 
    (matchedSubcategory ? CATEGORY_HERO_CONFIG[matchedSubcategory.parentCategoryId.toLowerCase()] : null) ||
    { image: FIREBASE_IMAGES.HOME_MENS_THOBE, position: 'center 30%' };
  const heroImage = heroConfig.image;
  const heroPosition = heroConfig.position;

  // Category not found - show loading while subcategories are being fetched
  if (isLoadingSubcategories && !isMainCategory && !fallbackSubcategory) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </Container>
    );
  }
  
  if (!categoryInfo && !isMainCategory && !matchedSubcategory && !(allSubcategories.length === 0 && fallbackSubcategory)) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-display mb-4">Category not found</h1>
          <p className="text-muted mb-6">The category "{slug}" doesn't exist.</p>
          <Link href="/shop" className="text-muted hover:text-bmr-ink underline">
            Back to shop
          </Link>
        </div>
      </Container>
    );
  }

  // Build breadcrumbs
  const breadcrumbItems = [
    { label: 'Shop', href: '/shop' },
  ];
  
  if (isSubcategory && parentCategory) {
    const parentId = matchedSubcategory?.parentCategoryId || fallbackSubcategory?.parentCategoryId || '';
    breadcrumbItems.push({
      label: parentCategory.name,
      href: `/category/${parentId.toLowerCase()}`,
    });
  }
  
  breadcrumbItems.push({
    label: categoryInfo?.name || slug,
    href: `/category/${slug}`,
  });

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[55vh] min-h-[400px] max-h-[650px] bg-surface-3">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={categoryInfo.name}
            fill
            className="object-cover"
            style={{ objectPosition: heroPosition }}
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        <Container className="relative h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="font-display text-4xl lg:text-6xl mb-3">{categoryInfo.name.toUpperCase()}</h1>
            {categoryInfo.description && (
              <p className="text-lg lg:text-xl text-white/90">{categoryInfo.description}</p>
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
              <Breadcrumbs items={breadcrumbItems} />
            </div>

            {/* Center/Left: Item count */}
            <div className="text-sm text-muted">
              {isLoading ? (
                'Loading...'
              ) : totalItems === 0 ? (
                'No products found'
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
                  {selectedSubcategory && (
                    <button
                      onClick={() => updateFilters('subcategory', '')}
                      className="flex items-center gap-1 px-3 py-1 bg-bmr-ink text-surface-2 text-sm rounded-full hover:bg-bmr-fg transition-colors"
                    >
                      {allSubcategories.find(s => s.slug === selectedSubcategory)?.name || selectedSubcategory}
                      <X className="w-3 h-3" />
                    </button>
                  )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Subcategory - Only show for main categories with subcategories (loaded from Firebase) */}
                {isMainCategory && categorySubcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-3">Style</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateFilters('subcategory', '')}
                      className={`px-4 py-2 text-sm border rounded transition-colors ${
                        !selectedSubcategory
                          ? 'bg-bmr-ink text-surface-2 border-bmr-ink'
                          : 'border-line hover:border-bmr-ink'
                      }`}
                    >
                      All
                    </button>
                    {categorySubcategories.map(sub => (
                      <button
                        key={sub.slug}
                        onClick={() => updateFilters('subcategory', sub.slug)}
                        className={`px-4 py-2 text-sm border rounded transition-colors ${
                          selectedSubcategory === sub.slug
                            ? 'bg-bmr-ink text-surface-2 border-bmr-ink'
                            : 'border-line hover:border-bmr-ink'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* Size - Only show for non-shemagh categories */}
                {slug.toLowerCase() !== 'shemaghs' && slug.toLowerCase() !== 'traditional' && slug.toLowerCase() !== 'yemeni' && (
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
                )}

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
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            // Empty State
            <div className="text-center py-20">
              <h3 className="font-display text-2xl mb-4">No products found</h3>
              <p className="text-muted mb-6">
                {activeFiltersCount > 0 
                  ? 'Try adjusting your filters or browse all products'
                  : 'No products have been added to this category yet'}
              </p>
              {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-8 py-3 bg-bmr-ink text-surface-2 rounded hover:bg-bmr-fg transition-colors"
              >
                Clear filters
              </button>
              )}
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
                      productTitleEn: product.name || product.titleEn || '',
                      productTitleAr: product.titleAr || '',
                      category: product.categoryId || 'THOBE',
                      sku: product.id,
                      size: product.sizes?.[0],
                      price: product.price || product.basePrice,
                      compareAt: product.compareAtPrice || undefined,
                      stock: product.counts?.totalStock ?? product.stock ?? 0,
                      active: true,
                      imageUrl: product.primaryImageUrl || product.images?.[0] || product.thumbnail || '',
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
                      return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                    })
                    .map((p, i, arr) => {
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
