import { adminDb } from './firebase-admin';
import type { Product, Category, NavItem } from '@/types';

/**
 * Server-side data operations using Firebase Admin SDK
 * These functions have elevated privileges and should only be called from API routes
 */

// Products
export async function adminCreateProduct(product: Omit<Product, 'id'>) {
  const docRef = await adminDb.collection('products').add({
    ...product,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function adminUpdateProduct(id: string, updates: Partial<Product>) {
  await adminDb
    .collection('products')
    .doc(id)
    .update({
      ...updates,
      updatedAt: new Date(),
    });
}

export async function adminDeleteProduct(id: string) {
  await adminDb.collection('products').doc(id).delete();
}

// Categories
export async function adminCreateCategory(category: Omit<Category, 'id'>) {
  const docRef = await adminDb.collection('categories').add(category);
  return docRef.id;
}

export async function adminUpdateCategory(id: string, updates: Partial<Category>) {
  await adminDb.collection('categories').doc(id).update(updates);
}

export async function adminDeleteCategory(id: string) {
  await adminDb.collection('categories').doc(id).delete();
}

// Navigation
export async function adminCreateNavItem(navItem: Omit<NavItem, 'id'>) {
  const docRef = await adminDb.collection('navigation').add(navItem);
  return docRef.id;
}

export async function adminUpdateNavItem(id: string, updates: Partial<NavItem>) {
  await adminDb.collection('navigation').doc(id).update(updates);
}

export async function adminDeleteNavItem(id: string) {
  await adminDb.collection('navigation').doc(id).delete();
}

// Settings
export async function adminUpdateSettings(collection: string, doc: string, data: any) {
  await adminDb.collection('settings').doc(doc).set(data, { merge: true });
}

// User verification
export async function verifyAdminUser(email: string): Promise<boolean> {
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(email);
}




