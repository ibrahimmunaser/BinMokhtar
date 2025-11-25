// Storefront product fetching utilities
// Filters products by status=ACTIVE and uses new image fields

import type { Product } from '@/types';

/**
 * Fetch all active products for the storefront
 * Only returns products with status='ACTIVE'
 */
export async function getStorefrontProducts(audience?: 'MEN' | 'CHILDREN'): Promise<Product[]> {
  if (typeof window === 'undefined') {
    // Server-side: return empty array, use static generation or server components
    return [];
  }

  try {
    // Fetch only ACTIVE products from API
    const response = await fetch(`/api/admin/products?status=ACTIVE`);
    const data = await response.json();
    
    console.log('🔍 DEBUG: Fetched products from API:', {
      success: data.success,
      totalProducts: data.products?.length || 0,
      products: data.products
    });
    
    if (data.success) {
      let products: Product[] = data.products || [];
      
      // Filter by audience if specified
      if (audience) {
        const upper = audience.toUpperCase();
        console.log(`🔍 DEBUG: Filtering for audience=${upper}`);
        
        products.forEach((p: any) => {
          console.log(`  Product "${p.name || p.titleEn}": audience="${p.audience}", status="${p.status}"`);
        });
        
        products = products.filter((p: any) => {
          const productAudience = p.audience || 'MEN';
          const matches = productAudience.toUpperCase() === upper;
          if (!matches) {
            console.log(`  ❌ Filtered out "${p.name || p.titleEn}" (audience=${productAudience}, expected=${upper})`);
          } else {
            console.log(`  ✅ Keeping "${p.name || p.titleEn}" (audience=${productAudience})`);
          }
          return matches;
        });
        
        console.log(`🔍 DEBUG: After filtering, ${products.length} products match audience=${upper}`);
      }
      
      // Ensure products have the new image fields, fallback to legacy if needed
      products = products.map(p => ({
        ...p,
        primaryImageUrl: p.primaryImageUrl || p.images?.[0] || p.thumbnail || p.defaultImage?.url,
        galleryImageUrls: p.galleryImageUrls || p.images || [],
        primaryImageAlt: p.primaryImageAlt || p.titleEn || p.name,
      }));
      
      console.log(`🔍 DEBUG: Returning ${products.length} products`);
      return products;
    }
    
    console.warn('❌ Failed to fetch storefront products');
    return [];
  } catch (error) {
    console.error('❌ Error fetching storefront products:', error);
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

