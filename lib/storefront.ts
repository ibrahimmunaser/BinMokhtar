// Storefront product fetching utilities
// Filters products by status=ACTIVE and uses category/subcategory

import type { Product } from '@/types';

// Valid categories for filtering
export type CategoryFilter = 'Men' | 'Boys' | 'Women' | 'Girls' | 'Shemaghs';

/**
 * Fetch all active products for the storefront
 * Only returns products with status='ACTIVE'
 * @param category - Optional category to filter by (e.g., 'Men', 'Boys', 'Shemaghs')
 */
export async function getStorefrontProducts(category?: CategoryFilter): Promise<Product[]> {
  if (typeof window === 'undefined') {
    // Server-side: return empty array, use static generation or server components
    return [];
  }

  try {
    // Fetch only ACTIVE products from API
    const response = await fetch(`/api/admin/products?status=ACTIVE`);
    const data = await response.json();
    
    if (data.success) {
      let products: Product[] = data.products || [];
      
      // Filter by category if specified
      if (category) {
        products = products.filter((p: any) => {
          const productCategory = p.categoryId || '';
          return productCategory.toLowerCase() === category.toLowerCase();
        });
      }
      
      // Ensure products have the new image fields and slug, fallback to legacy if needed
      products = products.map(p => {
        // Generate slug from name if missing
        const slug = p.slug || 
          ((p as any).name || p.titleEn || p.id || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        return {
          ...p,
          slug,
          primaryImageUrl: p.primaryImageUrl || p.galleryImageUrls?.[0] || (p.defaultImage?.url) || undefined,
          galleryImageUrls: p.galleryImageUrls || [],
          primaryImageAlt: p.primaryImageAlt || p.titleEn,
        };
      });
      
      return products;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching storefront products:', error);
    return [];
  }
}

/**
 * Fetch a single product by slug for the storefront
 * Only returns if status='ACTIVE'
 */
export async function getStorefrontProductBySlug(slug: string): Promise<Product | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const response = await fetch(`/api/admin/products?slug=${slug}`);
    const data = await response.json();
    
    if (data.success && data.product) {
      const product = data.product;
      
      // Only return if product is ACTIVE
      if (product.status !== 'ACTIVE') {
        console.warn(`Product ${slug} is not active (status: ${product.status})`);
        return null;
      }
      
      // Ensure product has the new image fields
      return {
        ...product,
        primaryImageUrl: product.primaryImageUrl || product.images?.[0] || product.thumbnail || product.defaultImage?.url,
        galleryImageUrls: product.galleryImageUrls || product.images || [],
        primaryImageAlt: product.primaryImageAlt || product.titleEn || product.name,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching storefront product:', error);
    return null;
  }
}

