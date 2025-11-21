import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { getAllProducts as getLocalAdminProducts } from './adminStore';
import type {
  Product,
  Category,
  NavItem,
  HomeSettings,
  HeaderSettings,
  Order,
  Lead,
  BulkLead,
} from '@/types';

// Navigation
export async function getNavigation(): Promise<NavItem[]> {
  const navCol = collection(db, 'navigation');
  const snapshot = await getDocs(navCol);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as NavItem));
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const catCol = collection(db, 'categories');
  const q = query(catCol, where('active', '==', true), orderBy('sort'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Category));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const catCol = collection(db, 'categories');
  const q = query(catCol, where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Category;
}

// Products - Updated to use status='ACTIVE' filter for storefront
export async function getProducts(constraints: QueryConstraint[] = []): Promise<Product[]> {
  const prodCol = collection(db, 'products');
  // Filter by status='ACTIVE' for storefront (only show active products)
  const baseConstraints = [where('status', '==', 'ACTIVE')];
  const q = query(prodCol, ...baseConstraints, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      // Ensure new image fields are populated, fallback to legacy fields
      primaryImageUrl: data.primaryImageUrl || data.images?.[0] || data.thumbnail || data.defaultImage?.url,
      galleryImageUrls: data.galleryImageUrls || data.images || [],
      primaryImageAlt: data.primaryImageAlt || data.titleEn || data.name,
    } as Product;
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const prodCol = collection(db, 'products');
  // Only return ACTIVE products for storefront
  const q = query(prodCol, where('slug', '==', slug), where('status', '==', 'ACTIVE'), limit(1));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const data = snapshot.docs[0].data();
    return { 
      id: snapshot.docs[0].id, 
      ...data,
      // Ensure new image fields are populated
      primaryImageUrl: data.primaryImageUrl || data.images?.[0] || data.thumbnail || data.defaultImage?.url,
      galleryImageUrls: data.galleryImageUrls || data.images || [],
      primaryImageAlt: data.primaryImageAlt || data.titleEn || data.name,
    } as Product;
  }

  // Fallback: try local admin data (mock/localStorage) so PDP works before Firebase is populated
  try {
    const local = getLocalAdminProducts() as any[];
    const match = local.find((p) => (p.slug === slug));
    // Only return if status is ACTIVE or if status field doesn't exist (legacy data)
    if (match && (!match.status || match.status === 'ACTIVE')) return match as Product;
  } catch (e) {
    // ignore fallback errors
  }
  return null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const products: Product[] = [];
  for (const id of ids) {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    // Only include ACTIVE products
    if (docSnap.exists() && data?.status === 'ACTIVE') {
      products.push({ 
        id: docSnap.id, 
        ...data,
        primaryImageUrl: data.primaryImageUrl || data.images?.[0] || data.thumbnail || data.defaultImage?.url,
        galleryImageUrls: data.galleryImageUrls || data.images || [],
        primaryImageAlt: data.primaryImageAlt || data.titleEn || data.name,
      } as Product);
    }
  }
  return products;
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return getProducts([where('categoryId', '==', categoryId), orderBy('createdAt', 'desc')]);
}

// Settings
export async function getHomeSettings(): Promise<HomeSettings | null> {
  const docRef = doc(db, 'settings', 'home');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as HomeSettings;
}

export async function getHeaderSettings(): Promise<HeaderSettings | null> {
  const docRef = doc(db, 'settings', 'header');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as HeaderSettings;
}

// Orders
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ordersCol = collection(db, 'orders');
  const docRef = await addDoc(ordersCol, {
    ...orderData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  // Decrement inventory for each item
  for (const item of orderData.items) {
    try {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const currentStock = productSnap.data().stock || 0;
        const newStock = Math.max(0, currentStock - item.qty);
        
        await updateDoc(productRef, {
          stock: newStock,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error(`Failed to update stock for product ${item.productId}:`, error);
      // Continue processing other items even if one fails
    }
  }
  
  return docRef.id;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const docRef = doc(db, 'orders', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Order;
}

// Leads
export async function createLead(email: string, source: string): Promise<void> {
  const leadsCol = collection(db, 'leads');
  await addDoc(leadsCol, {
    email,
    source,
    createdAt: Timestamp.now(),
  });
}

export async function createBulkLead(leadData: Omit<BulkLead, 'id' | 'createdAt'>): Promise<void> {
  const bulkLeadsCol = collection(db, 'bulkLeads');
  await addDoc(bulkLeadsCol, {
    ...leadData,
    createdAt: Timestamp.now(),
  });
}



