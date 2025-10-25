import useSWR from 'swr';
import {
  getProducts,
  getProductBySlug,
  getCategories,
  getHomeSettings,
  getHeaderSettings,
  getNavigation,
  getCategoryBySlug,
  getProductsByCategory,
  getProductsByIds,
} from '@/lib/data';
import { getAllProducts as getLocalProducts } from '@/lib/adminStore';
import type { Product, Category, HomeSettings, HeaderSettings, NavItem } from '@/types';

// Fetchers
const fetchers = {
  products: () => getProducts(),
  productBySlug: (slug: string) => getProductBySlug(slug),
  categories: () => getCategories(),
  categoryBySlug: (slug: string) => getCategoryBySlug(slug),
  productsByCategory: (categoryId: string) => getProductsByCategory(categoryId),
  productsByIds: (ids: string[]) => getProductsByIds(ids),
  homeSettings: () => getHomeSettings(),
  headerSettings: () => getHeaderSettings(),
  navigation: () => getNavigation(),
};

export function useProducts() {
  const { data, error, isLoading } = useSWR<Product[]>('products', fetchers.products);
  return { products: data, isLoading, error };
}

export function useProductBySlug(slug: string | null) {
  const { data, error, isLoading } = useSWR<Product | null>(
    slug ? ['product', slug] : null,
    async () => {
      if (!slug) return null;
      
      // Try Firestore first
      try {
        const firestoreProduct = await fetchers.productBySlug(slug);
        if (firestoreProduct) return firestoreProduct;
      } catch (e) {
        console.warn('Firestore fetch failed, trying local data');
      }

      // Fallback: try server API (admin route) by slug
      try {
        const res = await fetch(`/api/admin/products?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.product) return json.product as Product;
        }
      } catch (e) {
        console.warn('API slug fetch failed, trying local admin store');
      }
      
      // Fallback to local admin data
      try {
        const localProducts = getLocalProducts() as any[];
        const match = localProducts.find((p) => p.slug === slug);
        if (match) return match as Product;
      } catch (e) {
        console.error('Failed to load from local data:', e);
      }
      
      return null;
    }
  );
  return { product: data, isLoading, error };
}

export function useCategories() {
  const { data, error, isLoading } = useSWR<Category[]>('categories', fetchers.categories);
  return { categories: data || [], isLoading, error };
}

export function useCategoryBySlug(slug: string | null) {
  const { data, error, isLoading } = useSWR<Category | null>(
    slug ? ['category', slug] : null,
    () => fetchers.categoryBySlug(slug!)
  );
  return { category: data, isLoading, error };
}

export function useProductsByCategory(categoryId: string | null) {
  const { data, error, isLoading } = useSWR<Product[]>(
    categoryId ? ['products-by-category', categoryId] : null,
    () => fetchers.productsByCategory(categoryId!)
  );
  return { products: data || [], isLoading, error };
}

export function useProductsByIds(ids: string[]) {
  const { data, error, isLoading } = useSWR<Product[]>(
    ids.length ? ['products-by-ids', ...ids] : null,
    () => fetchers.productsByIds(ids)
  );
  return { products: data || [], isLoading, error };
}

export function useHomeSettings() {
  const { data, error, isLoading } = useSWR<HomeSettings | null>(
    'home-settings',
    fetchers.homeSettings
  );
  return { settings: data, isLoading, error };
}

export function useHeaderSettings() {
  const { data, error, isLoading } = useSWR<HeaderSettings | null>(
    'header-settings',
    fetchers.headerSettings
  );
  return { settings: data, isLoading, error };
}

export function useNavigation() {
  const { data, error, isLoading } = useSWR<NavItem[]>('navigation', fetchers.navigation);
  return { navigation: data || [], isLoading, error };
}








