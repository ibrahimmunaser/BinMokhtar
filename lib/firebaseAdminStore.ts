// Firebase-enabled admin store
// Uses Firestore for cloud storage with localStorage fallback

import type { Product } from '@/types';

// Check if we should use Firebase (when API routes are available)
const USE_FIREBASE = typeof window !== 'undefined';

// Fallback to localStorage functions
import { 
  getAllProducts as getLocalProducts,
  addProduct as addLocalProduct,
  deleteProduct as deleteLocalProduct,
  getAllCategories as getLocalCategories,
  addCategory as addLocalCategory,
  deleteCategory as deleteLocalCategory,
  updateCategory as updateLocalCategory,
} from './adminStore';

// Products
export async function getAllProducts(audience?: 'MEN'|'WOMEN'|'CHILDREN'): Promise<Product[]> {
  if (!USE_FIREBASE) return getLocalProducts();

  try {
    const qs = audience ? `?audience=${audience}` : '';
    const response = await fetch(`/api/admin/products${qs}`);
    const data = await response.json();
    
    if (data.success) {
      const remote: Product[] = data.products || [];
      if (remote.length > 0) return remote;
      // If remote is empty, prefer local (admin may have saved locally earlier)
      const local = getLocalProducts();
      if (local.length > 0) return local;
      return remote;
    }
    
    // Fallback to localStorage on error
    console.warn('Firebase fetch failed, using localStorage');
    return getLocalProducts();
  } catch (error) {
    console.error('Error fetching products from Firebase:', error);
    return getLocalProducts();
  }
}

export async function addProduct(productData: any): Promise<Product> {
  if (!USE_FIREBASE) return addLocalProduct(productData);

  try {
    // Make sure images and thumbnail are included
    const dataToSend = {
      ...productData,
      images: productData.images || ['/placeholder.svg'],
      thumbnail: productData.thumbnail || productData.images?.[0] || '/placeholder.svg',
    };

    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Also save to localStorage as backup
      addLocalProduct(dataToSend);
      return data.product;
    }
    
    throw new Error(data.error || 'Failed to create product');
  } catch (error) {
    console.error('Error creating product in Firebase:', error);
    // Fallback to localStorage
    return addLocalProduct(productData);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  if (!USE_FIREBASE) {
    deleteLocalProduct(productId);
    return;
  }

  try {
    const response = await fetch(`/api/admin/products?id=${productId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Also delete from localStorage
      deleteLocalProduct(productId);
      return;
    }
    
    throw new Error(data.error || 'Failed to delete product');
  } catch (error) {
    console.error('Error deleting product from Firebase:', error);
    // Fallback to localStorage
    deleteLocalProduct(productId);
  }
}

// Categories
export async function getAllCategories() {
  if (!USE_FIREBASE) return getLocalCategories();

  try {
    const response = await fetch('/api/admin/categories');
    const data = await response.json();
    
    if (data.success) {
      const remote = data.categories || [];
      if (remote.length > 0) return remote;
      const local = getLocalCategories();
      if (local.length > 0) return local;
      return remote;
    }
    
    // Fallback to localStorage on error
    console.warn('Firebase fetch failed, using localStorage');
    return getLocalCategories();
  } catch (error) {
    console.error('Error fetching categories from Firebase:', error);
    return getLocalCategories();
  }
}

export async function addCategory(categoryData: any) {
  if (!USE_FIREBASE) return addLocalCategory(categoryData);

  try {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Also save to localStorage as backup
      addLocalCategory(categoryData);
      return data.category;
    }
    
    throw new Error(data.error || 'Failed to create category');
  } catch (error) {
    console.error('Error creating category in Firebase:', error);
    // Fallback to localStorage
    return addLocalCategory(categoryData);
  }
}

export async function updateCategory(categoryId: string, updates: any): Promise<void> {
  if (!USE_FIREBASE) {
    updateLocalCategory(categoryId, updates);
    return;
  }

  try {
    const response = await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: categoryId, ...updates }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Also update localStorage
      updateLocalCategory(categoryId, updates);
      return;
    }
    
    throw new Error(data.error || 'Failed to update category');
  } catch (error) {
    console.error('Error updating category in Firebase:', error);
    // Fallback to localStorage
    updateLocalCategory(categoryId, updates);
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  if (!USE_FIREBASE) {
    deleteLocalCategory(categoryId);
    return;
  }

  try {
    const response = await fetch(`/api/admin/categories?id=${categoryId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Also delete from localStorage
      deleteLocalCategory(categoryId);
      return;
    }
    
    throw new Error(data.error || 'Failed to delete category');
  } catch (error) {
    console.error('Error deleting category from Firebase:', error);
    // Fallback to localStorage
    deleteLocalCategory(categoryId);
  }
}

export async function updateCategoryProductCounts(): Promise<void> {
  // This would be a cloud function in production
  // For now, we'll update counts when fetching products
  console.log('Category counts will be updated by cloud functions');
}

