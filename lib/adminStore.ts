// Admin data store using localStorage for persistence
import type { Product } from '@/types';
import { mockProducts } from './mockData';

const PRODUCTS_KEY = 'bmr_admin_products';
const CATEGORIES_KEY = 'bmr_admin_categories';

// Initialize with mock data if empty
function initializeProducts(): Product[] {
  if (typeof window === 'undefined') return mockProducts;
  
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // First time - save mock data
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(mockProducts));
  return mockProducts;
}

function initializeCategories() {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  const defaultCategories = [
    { id: 'thobes', name: 'Thobes', slug: 'thobes', description: 'Traditional Islamic robes for men and boys', active: true, productCount: 3 },
    { id: 'shemaghs', name: 'Shemaghs', slug: 'shemaghs', description: 'Traditional head scarves', active: true, productCount: 1 },
    { id: 'shaals', name: 'Shaals', slug: 'shaals', description: 'Hand-woven traditional scarves', active: true, productCount: 1 },
    { id: 'kufis', name: 'Kufis', slug: 'kufis', description: 'Traditional prayer caps', active: true, productCount: 1 },
  ];
  
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
  return defaultCategories;
}

// Products
export function getAllProducts(): Product[] {
  return initializeProducts();
}

export function addProduct(productData: any): Product {
  const products = getAllProducts();
  
  const newProduct: Product = {
    id: `product-${Date.now()}`,
    slug: productData.name.toLowerCase().replace(/\s+/g, '-'),
    titleEn: productData.name,
    titleAr: productData.titleAr || productData.name,
    subtitleEn: productData.subtitle || '',
    subtitleAr: productData.subtitleAr || productData.subtitle || '',
    category: productData.categoryId as any || 'THOBE',
    basePrice: Math.round(parseFloat(productData.price) * 100), // Convert to cents
    price: productData.price ? Math.round(parseFloat(productData.price) * 100) : undefined,
    compareAt: productData.compareAtPrice ? Math.round(parseFloat(productData.compareAtPrice) * 100) : undefined,
    colors: productData.colors ? productData.colors.split(',').map((c: string) => c.trim()) : undefined,
    sizes: productData.sizes ? productData.sizes.split(',').map((s: string) => s.trim()) : undefined,
    counts: {
      totalStock: parseInt(productData.stock) || 0,
      sold: 0,
      reserved: 0,
    },
    defaultImage: productData.image ? { url: productData.image, alt: productData.name } : undefined,
    descriptionEn: productData.description || '',
    descriptionAr: productData.descriptionAr || productData.description || '',
    status: productData.published ? 'ACTIVE' as any : 'DRAFT' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  products.push(newProduct);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  
  return newProduct;
}

export function updateProduct(productId: string, updates: Partial<Product>): void {
  const products = getAllProducts();
  const index = products.findIndex(p => p.id === productId);
  
  if (index !== -1) {
    products[index] = { ...products[index], ...updates, updatedAt: new Date() };
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }
}

export function deleteProduct(productId: string): void {
  const products = getAllProducts();
  const filtered = products.filter(p => p.id !== productId);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
}

// Categories
export function getAllCategories() {
  return initializeCategories();
}

export function addCategory(categoryData: any) {
  const categories = getAllCategories();
  
  const newCategory = {
    id: `cat-${Date.now()}`,
    name: categoryData.name,
    slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
    description: categoryData.description || '',
    active: true,
    productCount: 0,
  };
  
  categories.push(newCategory);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  
  return newCategory;
}

export function updateCategory(categoryId: string, updates: any): void {
  const categories = getAllCategories();
  const index = categories.findIndex(c => c.id === categoryId);
  
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updates };
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }
}

export function deleteCategory(categoryId: string): void {
  const categories = getAllCategories();
  const filtered = categories.filter(c => c.id !== categoryId);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
}

export function updateCategoryProductCounts(): void {
  const products = getAllProducts();
  const categories = getAllCategories();
  
  // Count products per category
  const counts: Record<string, number> = {};
  products.forEach(p => {
    counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
  });
  
  // Update categories
  categories.forEach(c => {
    c.productCount = counts[c.id] || 0;
  });
  
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}


