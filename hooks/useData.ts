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
    () => fetchers.productBySlug(slug!)
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




