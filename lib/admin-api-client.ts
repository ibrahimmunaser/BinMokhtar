/**
 * Client-side helpers for calling admin API routes
 * These functions make authenticated requests to server-side admin endpoints
 */

import { auth } from './firebase';

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-user-email': user.email || '',
  };
}

// Products
export async function createProduct(product: any) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers,
    body: JSON.stringify(product),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create product');
  }
  
  return response.json();
}

export async function updateProduct(id: string, updates: any) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/products', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ id, ...updates }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update product');
  }
  
  return response.json();
}

export async function deleteProduct(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/admin/products?id=${id}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete product');
  }
  
  return response.json();
}

// Categories
export async function createCategory(category: any) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/categories', {
    method: 'POST',
    headers,
    body: JSON.stringify(category),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create category');
  }
  
  return response.json();
}

export async function updateCategory(id: string, updates: any) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/categories', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ id, ...updates }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update category');
  }
  
  return response.json();
}

export async function deleteCategory(id: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`/api/admin/categories?id=${id}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete category');
  }
  
  return response.json();
}

// Settings
export async function updateSettings(collection: string, doc: string, data: any) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ collection, doc, data }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update settings');
  }
  
  return response.json();
}









