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
    // Normalize field names: database uses 'name' but types use 'titleEn'
    const titleEn = data.titleEn || data.name || '';
    const titleAr = data.titleAr || data.name || '';
    
    return { 
      id: doc.id, 
      ...data,
      // Map 'name' to 'titleEn' for consistency with types
      titleEn,
      titleAr,
      // Map categoryId to category for consistency
      category: data.category || data.categoryId,
      // Ensure new image fields are populated, fallback to legacy fields
      primaryImageUrl: data.primaryImageUrl || data.images?.[0] || data.thumbnail || data.defaultImage?.url,
      galleryImageUrls: data.galleryImageUrls || data.images || [],
      primaryImageAlt: data.primaryImageAlt || titleEn,
    } as Product;
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const prodCol = collection(db, 'products');
  // Only return ACTIVE products for storefront
  const q = query(prodCol, where('slug', '==', slug), where('status', '==', 'ACTIVE'), limit(1));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const productDoc = snapshot.docs[0];
    const data = productDoc.data();
    
    // Fetch variants subcollection for stock information
    let variants: any[] = [];
    try {
      const variantsCol = collection(db, 'products', productDoc.id, 'variants');
      const variantsSnapshot = await getDocs(variantsCol);
      variants = variantsSnapshot.docs.map(vDoc => ({
        id: vDoc.id,
        ...vDoc.data()
      }));
    } catch (e) {
      console.warn('Failed to fetch variants:', e);
    }
    
    // Normalize field names: database uses 'name' but types use 'titleEn'
    const titleEn = data.titleEn || data.name || '';
    const titleAr = data.titleAr || data.name || '';
    
    return { 
      id: productDoc.id, 
      ...data,
      // Map 'name' to 'titleEn' for consistency with types
      titleEn,
      titleAr,
      // Map categoryId to category for consistency
      category: data.category || data.categoryId,
      // Ensure new image fields are populated
      primaryImageUrl: data.primaryImageUrl || data.images?.[0] || data.thumbnail || data.defaultImage?.url,
      galleryImageUrls: data.galleryImageUrls || data.images || [],
      primaryImageAlt: data.primaryImageAlt || titleEn,
      // Include variants for stock checking
      variants,
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
      // Normalize field names
      const titleEn = data.titleEn || data.name || '';
      const titleAr = data.titleAr || data.name || '';
      
      products.push({ 
        id: docSnap.id, 
        ...data,
        titleEn,
        titleAr,
        category: data.category || data.categoryId,
        primaryImageUrl: data.primaryImageUrl || data.images?.[0] || data.thumbnail || data.defaultImage?.url,
        galleryImageUrls: data.galleryImageUrls || data.images || [],
        primaryImageAlt: data.primaryImageAlt || titleEn,
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
        const productData = productSnap.data();
        
        // Try to decrement variant stock first (per size/color combination)
        let variantUpdated = false;
        if (item.size || item.color) {
          try {
            // Find and update the specific variant
            const variantsCol = collection(db, 'products', item.productId, 'variants');
            const variantsSnapshot = await getDocs(variantsCol);
            
            for (const variantDoc of variantsSnapshot.docs) {
              const variantData = variantDoc.data();
              const sizeMatch = !item.size || variantData.size === item.size;
              const colorMatch = !item.color || variantData.color === item.color;
              
              if (sizeMatch && colorMatch) {
                const currentVariantStock = variantData.stock || 0;
                const newVariantStock = Math.max(0, currentVariantStock - item.qty);
                
                await updateDoc(doc(db, 'products', item.productId, 'variants', variantDoc.id), {
                  stock: newVariantStock,
                  updatedAt: Timestamp.now(),
                });
                
                variantUpdated = true;
                console.log(`Updated variant stock: ${item.productId}/${variantDoc.id} - ${currentVariantStock} → ${newVariantStock}`);
                break; // Found and updated the variant
              }
            }
          } catch (variantError) {
            console.warn(`Failed to update variant stock for ${item.productId}:`, variantError);
          }
        }
        
        // Also update the product-level totalStock in counts
        const currentCounts = productData.counts || { totalStock: 0 };
        const currentTotalStock = currentCounts.totalStock || productData.stock || 0;
        const newTotalStock = Math.max(0, currentTotalStock - item.qty);
        
        await updateDoc(productRef, {
          'counts.totalStock': newTotalStock,
          stock: newTotalStock, // Also update legacy field
          updatedAt: Timestamp.now(),
        });
        
        console.log(`Updated product totalStock: ${item.productId} - ${currentTotalStock} → ${newTotalStock}`);
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



